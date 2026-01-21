import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  FolderOpen,
  Plus,
  File,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  Loader2,
  Filter,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { sanitizeInput, sanitizeFileName, isAllowedFileType, isValidFileSize } from "@/lib/sanitize";
import { FILE_UPLOAD_CONFIG, DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";

interface Dokumen {
  id: string;
  tajuk: string;
  deskripsi: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  kategori: string;
  created_at: string;
  created_by: string | null;
}

const kategoris = [
  { value: DOCUMENT_CATEGORIES.PERATURAN, label: DOCUMENT_CATEGORY_LABELS[DOCUMENT_CATEGORIES.PERATURAN] },
  { value: DOCUMENT_CATEGORIES.MINIT, label: DOCUMENT_CATEGORY_LABELS[DOCUMENT_CATEGORIES.MINIT] },
  { value: DOCUMENT_CATEGORIES.KEWANGAN, label: DOCUMENT_CATEGORY_LABELS[DOCUMENT_CATEGORIES.KEWANGAN] },
  { value: DOCUMENT_CATEGORIES.SURAT, label: DOCUMENT_CATEGORY_LABELS[DOCUMENT_CATEGORIES.SURAT] },
  { value: DOCUMENT_CATEGORIES.LAPORAN, label: DOCUMENT_CATEGORY_LABELS[DOCUMENT_CATEGORIES.LAPORAN] },
  { value: DOCUMENT_CATEGORIES.LAIN, label: DOCUMENT_CATEGORY_LABELS[DOCUMENT_CATEGORIES.LAIN] },
];

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return FileImage;
  if (['zip', 'rar', '7z'].includes(ext || '')) return FileArchive;
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return FileSpreadsheet;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function Dokumen() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [documents, setDocuments] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Dokumen | null>(null);
  
  // Form states
  const [newTajuk, setNewTajuk] = useState("");
  const [newDeskripsi, setNewDeskripsi] = useState("");
  const [newKategori, setNewKategori] = useState<string>(DOCUMENT_CATEGORIES.LAIN);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isMobile = useIsMobile();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  const isPdf = (fileName: string) => fileName.toLowerCase().endsWith('.pdf');
  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };
  const canPreview = (fileName: string) => isPdf(fileName) || isImage(fileName);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dokumen')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Ralat",
        description: "Gagal memuat dokumen",
        variant: "destructive",
      });
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !newTajuk.trim()) {
      toast({
        title: "Ralat",
        description: "Sila masukkan tajuk dan pilih fail",
        variant: "destructive",
      });
      return;
    }

    // Validate file type and size
    if (!isAllowedFileType(selectedFile.name, FILE_UPLOAD_CONFIG.ALLOWED_TYPES)) {
      toast({
        title: "Ralat",
        description: `Jenis fail tidak dibenarkan. Sila gunakan: ${FILE_UPLOAD_CONFIG.ALLOWED_TYPES.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    if (!isValidFileSize(selectedFile.size, FILE_UPLOAD_CONFIG.MAX_SIZE_MB)) {
      toast({
        title: "Ralat",
        description: `Saiz fail tidak boleh melebihi ${FILE_UPLOAD_CONFIG.MAX_SIZE_MB}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Sanitize file name
      const sanitizedFileName = sanitizeFileName(selectedFile.name);
      const fileName = `${Date.now()}_${sanitizedFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dokumen')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('dokumen')
        .getPublicUrl(fileName);

      // Insert document record with sanitized data
      const { error: insertError } = await supabase
        .from('dokumen')
        .insert({
          tajuk: sanitizeInput(newTajuk.trim()),
          deskripsi: newDeskripsi.trim() ? sanitizeInput(newDeskripsi.trim()) : null,
          file_url: urlData.publicUrl,
          file_name: sanitizedFileName,
          file_size: selectedFile.size,
          kategori: newKategori,
          created_by: user?.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Berjaya",
        description: "Dokumen berjaya dimuat naik",
      });

      // Reset form
      setNewTajuk("");
      setNewDeskripsi("");
      setNewKategori(DOCUMENT_CATEGORIES.LAIN);
      setSelectedFile(null);
      setDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      handleError(error, {
        source: 'dokumen_upload',
        userFacingMessage: 'Gagal memuat naik dokumen',
      });
    }

    setUploading(false);
  };

  const handleDelete = async (doc: Dokumen) => {
    if (!confirm(`Padam dokumen "${doc.tajuk}"?`)) return;

    try {
      // Delete from storage
      const fileName = doc.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('dokumen').remove([fileName]);
      }

      // Delete record
      const { error } = await supabase
        .from('dokumen')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({
        title: "Berjaya",
        description: "Dokumen berjaya dipadam",
      });
      fetchDocuments();
    } catch (error) {
      handleError(error, {
        source: 'dokumen_delete',
        userFacingMessage: 'Gagal memadam dokumen',
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchSearch = doc.tajuk.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori = filterKategori === "all" || doc.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  const groupedDocuments = kategoris.reduce((acc, kat) => {
    const docs = filteredDocuments.filter(d => d.kategori === kat.value);
    if (docs.length > 0) {
      acc[kat.label] = docs;
    }
    return acc;
  }, {} as Record<string, Dokumen[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {!isMobile && (
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <main className={`min-h-screen transition-all duration-300 ${
        isMobile ? 'px-4 pb-24 pt-6' : sidebarCollapsed ? 'ml-20 p-8' : 'ml-[280px] p-8'
      }`}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <FolderOpen className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Dokumen
                </h1>
                <p className="text-muted-foreground">
                  Fail penting komuniti
                </p>
              </div>
            </div>

            {isAdmin && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Muat Naik
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Muat Naik Dokumen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="tajuk">Tajuk Dokumen</Label>
                      <Input
                        id="tajuk"
                        value={newTajuk}
                        onChange={(e) => setNewTajuk(e.target.value)}
                        placeholder="Masukkan tajuk..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="deskripsi">Deskripsi (Pilihan)</Label>
                      <Textarea
                        id="deskripsi"
                        value={newDeskripsi}
                        onChange={(e) => setNewDeskripsi(e.target.value)}
                        placeholder="Keterangan ringkas..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="kategori">Kategori</Label>
                      <Select value={newKategori} onValueChange={setNewKategori}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {kategoris.map(k => (
                            <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="file">Fail</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !selectedFile || !newTajuk.trim()}
                      className="w-full gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memuat naik...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Muat Naik
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <FloatingCard className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari dokumen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterKategori} onValueChange={setFilterKategori}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {kategoris.map(k => (
                      <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FloatingCard>
        </motion.div>

        {/* Documents List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Tiada dokumen</h3>
            <p className="text-sm text-muted-foreground/70">
              {searchQuery || filterKategori !== "all" 
                ? "Cuba carian atau penapis lain" 
                : "Muat naik dokumen pertama anda"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDocuments).map(([kategori, docs], idx) => (
              <motion.div
                key={kategori}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {kategori}
                  <Badge variant="secondary" className="ml-2">{docs.length}</Badge>
                </h2>
                <div className="grid gap-3">
                  {docs.map((doc) => {
                    const FileIcon = getFileIcon(doc.file_name);
                    return (
                      <FloatingCard key={doc.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{doc.tajuk}</h3>
                            {doc.deskripsi && (
                              <p className="text-sm text-muted-foreground truncate">{doc.deskripsi}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{doc.file_name}</span>
                              <span>•</span>
                              <span>{formatFileSize(doc.file_size)}</span>
                              <span>•</span>
                              <span>{format(new Date(doc.created_at), "dd MMM yyyy", { locale: ms })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canPreview(doc.file_name) ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPreviewDoc(doc)}
                                title="Lihat"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(doc.file_url, '_blank')}
                                title="Lihat"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Muat turun"
                            >
                              <a href={doc.file_url} download={doc.file_name}>
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(doc)}
                                className="text-destructive hover:text-destructive"
                                title="Padam"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </FloatingCard>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                {previewDoc?.tajuk}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden p-4">
              {previewDoc && isPdf(previewDoc.file_name) ? (
                <iframe
                  src={`${previewDoc.file_url}#toolbar=1&navpanes=0`}
                  className="w-full h-full rounded-lg border"
                  title={previewDoc.tajuk}
                />
              ) : previewDoc && isImage(previewDoc.file_name) ? (
                <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg overflow-auto">
                  <img
                    src={previewDoc.file_url}
                    alt={previewDoc.tajuk}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : null}
            </div>
            <div className="p-4 pt-2 border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {previewDoc?.file_name} • {formatFileSize(previewDoc?.file_size || null)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href={previewDoc?.file_url} download={previewDoc?.file_name}>
                    <Download className="w-4 h-4 mr-2" />
                    Muat Turun
                  </a>
                </Button>
                <Button variant="outline" onClick={() => window.open(previewDoc?.file_url, '_blank')}>
                  Buka Tab Baru
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {isMobile && <MobileBottomNav />}
    </div>
  );
}