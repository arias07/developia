import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';
import { sendTeamInviteEmail } from '@/lib/emails/resend';
import type { UserRole } from '@/types/database';

// Admin-only endpoint for inviting team members
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user's token
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { email, role, specializations, hourlyRate } = body as {
      email: string;
      role: UserRole;
      specializations?: string;
      hourlyRate?: string;
    };

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email already has a pending invite
    const { data: existingInvite } = await supabaseAdmin
      .from('team_invites')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'This email already has a pending invitation' },
        { status: 409 }
      );
    }

    // Check if email is already a team member
    const { data: existingMember } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingMember) {
      // Check if they're already a team member
      const { data: teamMember } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('profile_id', existingMember.id)
        .single();

      if (teamMember) {
        return NextResponse.json(
          { error: 'This email is already a team member' },
          { status: 409 }
        );
      }
    }

    // Generate unique invite token
    const inviteToken = randomBytes(32).toString('hex');

    // Parse specializations
    const specializationsArray = specializations
      ? specializations
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      : [];

    // Parse hourly rate
    const parsedHourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;

    // Create invite record
    const { data: invite, error: insertError } = await supabaseAdmin
      .from('team_invites')
      .insert({
        email: email.toLowerCase(),
        role,
        specializations: specializationsArray,
        hourly_rate: parsedHourlyRate,
        invite_token: inviteToken,
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create team invite', insertError, { service: 'team-invite' });
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Send invite email
    const emailSent = await sendTeamInviteEmail({
      email: email.toLowerCase(),
      role,
      specializations: specializationsArray,
      hourlyRate: parsedHourlyRate || undefined,
      inviteToken,
      invitedBy: profile.full_name,
    });

    if (!emailSent) {
      logger.warn('Team invite created but email failed to send', {
        service: 'team-invite',
        inviteId: invite.id,
      });
    }

    logger.info('Team invite sent', {
      service: 'team-invite',
      inviteId: invite.id,
      email: email.toLowerCase(),
      role,
      invitedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      emailSent,
      message: emailSent
        ? 'Invitation sent successfully'
        : 'Invitation created but email could not be sent',
    });
  } catch (error) {
    logger.error('Error sending team invite', error, { service: 'team-invite' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET pending invites (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all invites with inviter info
    const { data: invites, error: fetchError } = await supabaseAdmin
      .from('team_invites')
      .select(
        `
        *,
        inviter:profiles!team_invites_invited_by_fkey(full_name, email)
      `
      )
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error('Failed to fetch team invites', fetchError, { service: 'team-invite' });
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invites });
  } catch (error) {
    logger.error('Error fetching team invites', error, { service: 'team-invite' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
