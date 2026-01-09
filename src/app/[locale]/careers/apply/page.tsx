'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LocalizedLink } from '@/components/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  User,
  Briefcase,
  Code2,
  Link as LinkIcon,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

const content = {
  es: {
    nav: {
      back: 'Volver a carreras',
    },
    title: 'Aplica para unirte a Devvy',
    subtitle: 'Completa el formulario y nos pondremos en contacto contigo pronto.',
    steps: [
      { title: 'Info personal', icon: User },
      { title: 'Experiencia', icon: Briefcase },
      { title: 'Habilidades', icon: Code2 },
      { title: 'Portafolio', icon: LinkIcon },
      { title: 'Final', icon: FileText },
    ],
    form: {
      personal: {
        title: 'Información personal',
        description: 'Cuéntanos sobre ti',
        fullName: 'Nombre completo',
        fullNamePlaceholder: 'Tu nombre',
        email: 'Correo electrónico',
        emailPlaceholder: 'tu@email.com',
        phone: 'Teléfono (opcional)',
        phonePlaceholder: '+52 33 1234 5678',
        country: 'País',
        countryPlaceholder: 'Selecciona tu país',
        city: 'Ciudad',
        cityPlaceholder: 'Tu ciudad',
      },
      experience: {
        title: 'Experiencia profesional',
        description: 'Cuéntanos sobre tu trayectoria',
        jobTitle: 'Título profesional',
        jobTitlePlaceholder: 'Ej: Full-Stack Developer',
        yearsExperience: 'Años de experiencia',
        hourlyRate: 'Tarifa por hora esperada (USD)',
        hourlyRatePlaceholder: 'Ej: 35',
        availability: 'Disponibilidad',
        availabilityOptions: {
          full_time: 'Tiempo completo (40+ hrs/semana)',
          part_time: 'Medio tiempo (20-40 hrs/semana)',
          freelance: 'Freelance (menos de 20 hrs/semana)',
        },
        weeklyHours: 'Horas disponibles por semana',
      },
      skills: {
        title: 'Habilidades técnicas',
        description: 'Selecciona tus habilidades principales',
        primarySkills: 'Habilidades principales',
        primarySkillsHelp: 'Selecciona hasta 5 habilidades principales',
        secondarySkills: 'Habilidades secundarias',
        secondarySkillsHelp: 'Otras tecnologías que conoces',
        specializations: 'Especializaciones',
        specializationsHelp: 'Tipos de proyectos en los que te especializas',
        languages: 'Idiomas',
      },
      portfolio: {
        title: 'Portafolio y enlaces',
        description: 'Comparte tu trabajo y perfiles',
        portfolioUrl: 'URL de portafolio',
        portfolioUrlPlaceholder: 'https://tuportafolio.com',
        githubUrl: 'GitHub',
        githubUrlPlaceholder: 'https://github.com/tuusuario',
        linkedinUrl: 'LinkedIn',
        linkedinUrlPlaceholder: 'https://linkedin.com/in/tuusuario',
        resumeUrl: 'CV/Resume (URL)',
        resumeUrlPlaceholder: 'https://...',
      },
      final: {
        title: 'Información adicional',
        description: 'Cuéntanos por qué quieres unirte',
        coverLetter: 'Carta de presentación',
        coverLetterPlaceholder: 'Cuéntanos sobre ti, tu experiencia y por qué te gustaría trabajar con nosotros...',
        referralSource: '¿Cómo nos encontraste?',
        referralOptions: {
          google: 'Google',
          linkedin: 'LinkedIn',
          twitter: 'Twitter/X',
          friend: 'Recomendación de amigo',
          other: 'Otro',
        },
        bio: 'Bio corta',
        bioPlaceholder: 'Una breve descripción sobre ti (2-3 oraciones)',
      },
    },
    buttons: {
      next: 'Siguiente',
      back: 'Atrás',
      submit: 'Enviar aplicación',
      submitting: 'Enviando...',
    },
    success: {
      title: '¡Aplicación enviada!',
      description: 'Gracias por tu interés en unirte a Devvy. Revisaremos tu aplicación y nos pondremos en contacto contigo en las próximas 24-48 horas.',
      button: 'Volver al inicio',
    },
    errors: {
      required: 'Este campo es requerido',
      email: 'Email inválido',
      submit: 'Error al enviar la aplicación. Por favor intenta de nuevo.',
    },
  },
  en: {
    nav: {
      back: 'Back to careers',
    },
    title: 'Apply to join Devvy',
    subtitle: "Complete the form and we'll get in touch with you soon.",
    steps: [
      { title: 'Personal info', icon: User },
      { title: 'Experience', icon: Briefcase },
      { title: 'Skills', icon: Code2 },
      { title: 'Portfolio', icon: LinkIcon },
      { title: 'Final', icon: FileText },
    ],
    form: {
      personal: {
        title: 'Personal information',
        description: 'Tell us about yourself',
        fullName: 'Full name',
        fullNamePlaceholder: 'Your name',
        email: 'Email',
        emailPlaceholder: 'you@email.com',
        phone: 'Phone (optional)',
        phonePlaceholder: '+1 555 123 4567',
        country: 'Country',
        countryPlaceholder: 'Select your country',
        city: 'City',
        cityPlaceholder: 'Your city',
      },
      experience: {
        title: 'Professional experience',
        description: 'Tell us about your career',
        jobTitle: 'Job title',
        jobTitlePlaceholder: 'E.g.: Full-Stack Developer',
        yearsExperience: 'Years of experience',
        hourlyRate: 'Expected hourly rate (USD)',
        hourlyRatePlaceholder: 'E.g.: 35',
        availability: 'Availability',
        availabilityOptions: {
          full_time: 'Full time (40+ hrs/week)',
          part_time: 'Part time (20-40 hrs/week)',
          freelance: 'Freelance (less than 20 hrs/week)',
        },
        weeklyHours: 'Hours available per week',
      },
      skills: {
        title: 'Technical skills',
        description: 'Select your main skills',
        primarySkills: 'Primary skills',
        primarySkillsHelp: 'Select up to 5 primary skills',
        secondarySkills: 'Secondary skills',
        secondarySkillsHelp: 'Other technologies you know',
        specializations: 'Specializations',
        specializationsHelp: 'Types of projects you specialize in',
        languages: 'Languages',
      },
      portfolio: {
        title: 'Portfolio and links',
        description: 'Share your work and profiles',
        portfolioUrl: 'Portfolio URL',
        portfolioUrlPlaceholder: 'https://yourportfolio.com',
        githubUrl: 'GitHub',
        githubUrlPlaceholder: 'https://github.com/yourusername',
        linkedinUrl: 'LinkedIn',
        linkedinUrlPlaceholder: 'https://linkedin.com/in/yourusername',
        resumeUrl: 'CV/Resume (URL)',
        resumeUrlPlaceholder: 'https://...',
      },
      final: {
        title: 'Additional information',
        description: 'Tell us why you want to join',
        coverLetter: 'Cover letter',
        coverLetterPlaceholder: 'Tell us about yourself, your experience and why you would like to work with us...',
        referralSource: 'How did you find us?',
        referralOptions: {
          google: 'Google',
          linkedin: 'LinkedIn',
          twitter: 'Twitter/X',
          friend: 'Friend referral',
          other: 'Other',
        },
        bio: 'Short bio',
        bioPlaceholder: 'A brief description about you (2-3 sentences)',
      },
    },
    buttons: {
      next: 'Next',
      back: 'Back',
      submit: 'Submit application',
      submitting: 'Submitting...',
    },
    success: {
      title: 'Application submitted!',
      description: "Thank you for your interest in joining Devvy. We'll review your application and get back to you within 24-48 hours.",
      button: 'Back to home',
    },
    errors: {
      required: 'This field is required',
      email: 'Invalid email',
      submit: 'Error submitting application. Please try again.',
    },
  },
};

const skillOptions = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript',
  'Node.js', 'Python', 'Go', 'Rust', 'Java', 'C#',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
  'TailwindCSS', 'CSS', 'Sass', 'Figma', 'Adobe XD',
  'React Native', 'Flutter', 'Swift', 'Kotlin',
  'Supabase', 'Firebase', 'Prisma', 'Stripe',
];

const specializationOptions = {
  es: ['E-commerce', 'SaaS', 'Apps Móviles', 'Landing Pages', 'Dashboards', 'APIs', 'IA/ML', 'Web3', 'Juegos'],
  en: ['E-commerce', 'SaaS', 'Mobile Apps', 'Landing Pages', 'Dashboards', 'APIs', 'AI/ML', 'Web3', 'Games'],
};

const languageOptions = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
];

const countries = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica',
  'Cuba', 'Ecuador', 'El Salvador', 'España', 'Guatemala', 'Honduras',
  'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Puerto Rico',
  'República Dominicana', 'Uruguay', 'Venezuela', 'United States', 'Canada', 'Other',
];

export default function ApplyPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = content[locale as keyof typeof content] || content.es;

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Personal
    full_name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    // Experience
    title: '',
    years_experience: 0,
    expected_hourly_rate: 0,
    availability: 'full_time',
    weekly_hours_available: 40,
    // Skills
    primary_skills: [] as string[],
    secondary_skills: [] as string[],
    specializations: [] as string[],
    languages: ['es'],
    // Portfolio
    portfolio_url: '',
    github_url: '',
    linkedin_url: '',
    resume_url: '',
    // Final
    cover_letter: '',
    bio: '',
    referral_source: '',
  });

  const updateForm = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    if (currentArray.includes(item)) {
      updateForm(field, currentArray.filter((i) => i !== item));
    } else {
      updateForm(field, [...currentArray, item]);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Personal
        return formData.full_name && formData.email && formData.country;
      case 1: // Experience
        return formData.title && formData.years_experience >= 0;
      case 2: // Skills
        return formData.primary_skills.length > 0;
      case 3: // Portfolio
        return true; // Optional
      case 4: // Final
        return true; // Optional
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const supabase = getSupabaseClient();

      const { error: submitError } = await supabase
        .from('freelancer_applications')
        .insert({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
          country: formData.country,
          city: formData.city || null,
          title: formData.title,
          bio: formData.bio || null,
          years_experience: formData.years_experience,
          expected_hourly_rate: formData.expected_hourly_rate || null,
          primary_skills: formData.primary_skills,
          secondary_skills: formData.secondary_skills,
          specializations: formData.specializations,
          languages: formData.languages,
          portfolio_url: formData.portfolio_url || null,
          github_url: formData.github_url || null,
          linkedin_url: formData.linkedin_url || null,
          resume_url: formData.resume_url || null,
          cover_letter: formData.cover_letter || null,
          availability: formData.availability,
          weekly_hours_available: formData.weekly_hours_available,
          referral_source: formData.referral_source || null,
          status: 'pending',
        });

      if (submitError) throw submitError;

      setSubmitted(true);
    } catch {
      setError(t.errors.submit);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">{t.success.title}</h1>
          <p className="text-slate-400 mb-8">{t.success.description}</p>
          <LocalizedLink href="/">
            <Button className="bg-gradient-to-r from-purple-600 to-cyan-600">
              {t.success.button}
            </Button>
          </LocalizedLink>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <LocalizedLink
          href="/careers"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.nav.back}
        </LocalizedLink>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {t.steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  index <= currentStep
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < t.steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    index < currentStep ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">{t.steps[currentStep].title}</CardTitle>
            <CardDescription>
              {currentStep === 0 && t.form.personal.description}
              {currentStep === 1 && t.form.experience.description}
              {currentStep === 2 && t.form.skills.description}
              {currentStep === 3 && t.form.portfolio.description}
              {currentStep === 4 && t.form.final.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 0: Personal Info */}
            {currentStep === 0 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-white">
                      {t.form.personal.fullName} *
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => updateForm('full_name', e.target.value)}
                      placeholder={t.form.personal.fullNamePlaceholder}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      {t.form.personal.email} *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      placeholder={t.form.personal.emailPlaceholder}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">
                    {t.form.personal.phone}
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder={t.form.personal.phonePlaceholder}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-white">
                      {t.form.personal.country} *
                    </Label>
                    <Select value={formData.country} onValueChange={(v) => updateForm('country', v)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder={t.form.personal.countryPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">
                      {t.form.personal.city}
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateForm('city', e.target.value)}
                      placeholder={t.form.personal.cityPlaceholder}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Experience */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">
                    {t.form.experience.jobTitle} *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder={t.form.experience.jobTitlePlaceholder}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="years_experience" className="text-white">
                      {t.form.experience.yearsExperience} *
                    </Label>
                    <Input
                      id="years_experience"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.years_experience}
                      onChange={(e) => updateForm('years_experience', parseInt(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate" className="text-white">
                      {t.form.experience.hourlyRate}
                    </Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      min="0"
                      value={formData.expected_hourly_rate || ''}
                      onChange={(e) => updateForm('expected_hourly_rate', parseInt(e.target.value) || 0)}
                      placeholder={t.form.experience.hourlyRatePlaceholder}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">{t.form.experience.availability}</Label>
                    <Select
                      value={formData.availability}
                      onValueChange={(v) => updateForm('availability', v)}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(t.form.experience.availabilityOptions).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weekly_hours" className="text-white">
                      {t.form.experience.weeklyHours}
                    </Label>
                    <Input
                      id="weekly_hours"
                      type="number"
                      min="5"
                      max="60"
                      value={formData.weekly_hours_available}
                      onChange={(e) => updateForm('weekly_hours_available', parseInt(e.target.value) || 40)}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Skills */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label className="text-white">{t.form.skills.primarySkills} *</Label>
                  <p className="text-xs text-slate-500">{t.form.skills.primarySkillsHelp}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillOptions.map((skill) => (
                      <Badge
                        key={skill}
                        variant={formData.primary_skills.includes(skill) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-colors ${
                          formData.primary_skills.includes(skill)
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'border-slate-600 hover:bg-slate-800'
                        }`}
                        onClick={() => toggleArrayItem('primary_skills', skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">{t.form.skills.specializations}</Label>
                  <p className="text-xs text-slate-500">{t.form.skills.specializationsHelp}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {specializationOptions[locale as keyof typeof specializationOptions]?.map((spec) => (
                      <Badge
                        key={spec}
                        variant={formData.specializations.includes(spec) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-colors ${
                          formData.specializations.includes(spec)
                            ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                            : 'border-slate-600 hover:bg-slate-800'
                        }`}
                        onClick={() => toggleArrayItem('specializations', spec)}
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">{t.form.skills.languages}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {languageOptions.map((lang) => (
                      <Badge
                        key={lang.code}
                        variant={formData.languages.includes(lang.code) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-colors ${
                          formData.languages.includes(lang.code)
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'border-slate-600 hover:bg-slate-800'
                        }`}
                        onClick={() => toggleArrayItem('languages', lang.code)}
                      >
                        {lang.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Portfolio */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_url" className="text-white">
                    {t.form.portfolio.portfolioUrl}
                  </Label>
                  <Input
                    id="portfolio_url"
                    value={formData.portfolio_url}
                    onChange={(e) => updateForm('portfolio_url', e.target.value)}
                    placeholder={t.form.portfolio.portfolioUrlPlaceholder}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_url" className="text-white">
                    {t.form.portfolio.githubUrl}
                  </Label>
                  <Input
                    id="github_url"
                    value={formData.github_url}
                    onChange={(e) => updateForm('github_url', e.target.value)}
                    placeholder={t.form.portfolio.githubUrlPlaceholder}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url" className="text-white">
                    {t.form.portfolio.linkedinUrl}
                  </Label>
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={(e) => updateForm('linkedin_url', e.target.value)}
                    placeholder={t.form.portfolio.linkedinUrlPlaceholder}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resume_url" className="text-white">
                    {t.form.portfolio.resumeUrl}
                  </Label>
                  <Input
                    id="resume_url"
                    value={formData.resume_url}
                    onChange={(e) => updateForm('resume_url', e.target.value)}
                    placeholder={t.form.portfolio.resumeUrlPlaceholder}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </>
            )}

            {/* Step 4: Final */}
            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">
                    {t.form.final.bio}
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => updateForm('bio', e.target.value)}
                    placeholder={t.form.final.bioPlaceholder}
                    className="bg-slate-800 border-slate-700 min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover_letter" className="text-white">
                    {t.form.final.coverLetter}
                  </Label>
                  <Textarea
                    id="cover_letter"
                    value={formData.cover_letter}
                    onChange={(e) => updateForm('cover_letter', e.target.value)}
                    placeholder={t.form.final.coverLetterPlaceholder}
                    className="bg-slate-800 border-slate-700 min-h-[150px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">{t.form.final.referralSource}</Label>
                  <Select
                    value={formData.referral_source}
                    onValueChange={(v) => updateForm('referral_source', v)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(t.form.final.referralOptions).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={currentStep === 0}
                className="border-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.buttons.back}
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                >
                  {t.buttons.next}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.buttons.submitting}
                    </>
                  ) : (
                    <>
                      {t.buttons.submit}
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
