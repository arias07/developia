'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreVertical,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Eye,
  Upload,
  FolderOpen,
  HardDrive,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
  path: string;
  url: string;
}

const BUCKET_NAME = 'devvybuck';

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-400" />,
  doc: <FileText className="w-5 h-5 text-blue-400" />,
  docx: <FileText className="w-5 h-5 text-blue-400" />,
  jpg: <Image className="w-5 h-5 text-green-400" />,
  jpeg: <Image className="w-5 h-5 text-green-400" />,
  png: <Image className="w-5 h-5 text-green-400" />,
  gif: <Image className="w-5 h-5 text-purple-400" />,
  svg: <Image className="w-5 h-5 text-yellow-400" />,
  default: <File className="w-5 h-5 text-slate-400" />,
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return fileTypeIcons[ext] || fileTypeIcons.default;
}

export default function AdminDocumentsPage() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    images: 0,
    documents: 0,
  });

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (data && !error) {
      const filesWithUrls = await Promise.all(
        data
          .filter((item) => item.name && !item.id?.includes('/')) // Filter out folders
          .map(async (file) => {
            const {
              data: { publicUrl },
            } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name);

            return {
              id: file.id || file.name,
              name: file.name,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || 'unknown',
              created_at: file.created_at || new Date().toISOString(),
              updated_at: file.updated_at || new Date().toISOString(),
              path: file.name,
              url: publicUrl,
            };
          })
      );

      setFiles(filesWithUrls);

      // Calculate stats
      const totalSize = filesWithUrls.reduce((sum, f) => sum + f.size, 0);
      const images = filesWithUrls.filter((f) =>
        f.type.startsWith('image/')
      ).length;
      const documents = filesWithUrls.filter(
        (f) => f.type.includes('pdf') || f.type.includes('document')
      ).length;

      setStats({
        totalFiles: filesWithUrls.length,
        totalSize,
        images,
        documents,
      });
    }

    setLoading(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = getSupabaseClient();

    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);

    if (!error) {
      await fetchFiles();
    }

    setUploading(false);
  };

  const handleDelete = async (path: string) => {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (!error) {
      setFiles((prev) => prev.filter((f) => f.path !== path));
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'images' && file.type.startsWith('image/')) ||
      (typeFilter === 'documents' &&
        (file.type.includes('pdf') || file.type.includes('document'))) ||
      (typeFilter === 'other' &&
        !file.type.startsWith('image/') &&
        !file.type.includes('pdf') &&
        !file.type.includes('document'));
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <FolderOpen className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Archivos</p>
                  <p className="text-2xl font-bold text-white">{stats.totalFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <HardDrive className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Espacio usado</p>
                  <p className="text-2xl font-bold text-white">{formatBytes(stats.totalSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Image className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Imagenes</p>
                  <p className="text-2xl font-bold text-white">{stats.images}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <FileText className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Documentos</p>
                  <p className="text-2xl font-bold text-white">{stats.documents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters & Upload */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar archivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">Todos</SelectItem>
                <SelectItem value="images" className="text-white">Imagenes</SelectItem>
                <SelectItem value="documents" className="text-white">Documentos</SelectItem>
                <SelectItem value="other" className="text-white">Otros</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <input
                type="file"
                onChange={handleUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <Button
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 w-full sm:w-auto"
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Subiendo...' : 'Subir archivo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            Archivos en {BUCKET_NAME} ({filteredFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando archivos...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron archivos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Archivo</TableHead>
                    <TableHead className="text-slate-400">Tipo</TableHead>
                    <TableHead className="text-slate-400">Tamano</TableHead>
                    <TableHead className="text-slate-400">Fecha</TableHead>
                    <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.name)}
                          <span className="text-white font-medium truncate max-w-[200px]">
                            {file.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{formatBytes(file.size)}</TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(file.created_at).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              className="text-slate-300 hover:text-white cursor-pointer"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-slate-300 hover:text-white cursor-pointer"
                              onClick={() => handleDownload(file.url, file.name)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Descargar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                              onClick={() => handleDelete(file.path)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
