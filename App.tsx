
import React, { useState, useRef, useCallback } from 'react';
// Added ReactDOM import to fix 'Cannot find name ReactDOM' error on line 108
import ReactDOM from 'react-dom/client';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  User, 
  Lock, 
  Plus, 
  FileDown, 
  Trash2, 
  Monitor, 
  RotateCcw, 
  Maximize, 
  Inbox,
  Layout
} from 'lucide-react';
import { CredentialLabel } from './types';

// Component for the printable label - Updated to 10cm x 10cm equivalent (400px square)
const LabelCard = React.forwardRef<HTMLDivElement, { username: string; password: string; className?: string }>(
  ({ username, password, className }, ref) => (
    <div 
      ref={ref}
      className={`bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 w-[400px] h-[400px] aspect-square ${className}`}
    >
      <div className="flex flex-col items-center space-y-1">
        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Usuário</span>
        <div className="p-2 bg-white border border-gray-100 rounded-lg">
          <QRCodeSVG value={username || ' '} size={130} level="H" />
        </div>
        <span className="text-sm font-semibold text-gray-700 break-all text-center px-4 leading-tight">{username || 'Aguardando...'}</span>
      </div>

      <div className="flex flex-col items-center space-y-1 -mt-3">
        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Senha</span>
        <div className="p-2 bg-white border border-gray-100 rounded-lg">
          <QRCodeSVG value={password || ' '} size={130} level="H" />
        </div>
        <span className="text-sm font-semibold text-gray-700 break-all text-center px-4 leading-tight">{password || 'Aguardando...'}</span>
      </div>
    </div>
  )
);

LabelCard.displayName = 'LabelCard';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [batch, setBatch] = useState<CredentialLabel[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleAddToBatch = () => {
    if (!username.trim() || !password.trim()) return;
    
    const newLabel: CredentialLabel = {
      id: crypto.randomUUID(),
      username,
      password,
      timestamp: Date.now()
    };
    
    setBatch(prev => [newLabel, ...prev]);
    setUsername('');
    setPassword('');
  };

  const removeFromBatch = (id: string) => {
    setBatch(prev => prev.filter(item => item.id !== id));
  };

  const generatePDF = async (element: HTMLElement, filename: string) => {
    // Aumentamos a escala para garantir nitidez máxima no 10x10cm
    const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 100] // Formato exato 10cm x 10cm
    });
    
    // Adiciona a imagem preenchendo toda a página de 100mm x 100mm
    pdf.addImage(imgData, 'PNG', 0, 0, 100, 100);
    pdf.save(filename);
  };

  const handleDownloadIndividual = async () => {
    if (previewRef.current) {
      await generatePDF(previewRef.current, `etiqueta-${username || 'credencial'}.pdf`);
    }
  };

  const handleDownloadBatch = async () => {
    if (batch.length === 0) return;
    
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 100] });
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    document.body.appendChild(tempContainer);

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      const root = ReactDOM.createRoot(tempContainer);
      
      // Render to temp container
      await new Promise<void>((resolve) => {
        root.render(<LabelCard username={item.username} password={item.password} />);
        setTimeout(resolve, 150); // Small delay to ensure QR code renders
      });

      const canvas = await html2canvas(tempContainer, { scale: 3, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      if (i > 0) pdf.addPage([100, 100], 'portrait');
      
      pdf.addImage(imgData, 'PNG', 0, 0, 100, 100);
      root.unmount(); // Limpa para o próximo item
    }

    pdf.save(`lote-etiquetas-10x10-${Date.now()}.pdf`);
    document.body.removeChild(tempContainer);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-2 rounded-lg">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Gerador de Etiquetas Pro</h1>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600 uppercase">
            <Maximize className="w-3 h-3" />
            Padrão: 10x10cm
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Monitor className="w-5 h-5" /></button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><RotateCcw className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 block">
                  Credencial de Usuário
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: jeandsds"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 block">
                  Senha Provisória
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ex: Sk@tesk804"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleDownloadIndividual}
              disabled={!username || !password}
              className="w-full py-4 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <FileDown className="w-5 h-5" />
              Gerar PDF Individual
            </button>
            <button 
              onClick={handleAddToBatch}
              disabled={!username || !password}
              className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Adicionar ao Lote
            </button>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4 block text-center">Exportação</span>
            <button 
              onClick={handleDownloadBatch}
              disabled={batch.length === 0}
              className="w-full py-4 bg-slate-400 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Inbox className="w-5 h-5" />
              Salvar Lote em PDF
            </button>
          </div>
        </div>

        {/* Middle Column: Live Preview */}
        <div className="lg:col-span-6 flex flex-col items-center justify-start pt-4">
          <div className="relative group">
            <div className="absolute -inset-4 bg-white/40 blur-2xl rounded-3xl -z-10 transition-all group-hover:bg-white/60"></div>
            <LabelCard 
              ref={previewRef}
              username={username} 
              password={password} 
              className="shadow-2xl" 
            />
          </div>
          
          <div className="mt-8 flex items-center gap-2 bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Formato 10x10cm (1:1)</span>
          </div>
        </div>

        {/* Right Column: Batch List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full max-h-[700px]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Fila de Lote</h2>
              <span className="px-3 py-1 bg-sky-100 text-sky-600 text-[10px] font-bold rounded-full">
                {batch.length} ITENS
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {batch.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Inbox className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm italic text-gray-500">Aguardando itens...</p>
                </div>
              ) : (
                batch.map((item) => (
                  <div 
                    key={item.id}
                    className="group bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-sky-200 hover:bg-white transition-all flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700 truncate max-w-[150px]">{item.username}</span>
                      <span className="text-[10px] text-gray-400 font-medium">#{item.id.slice(0, 8)}</span>
                    </div>
                    <button 
                      onClick={() => removeFromBatch(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Status */}
      <footer className="px-8 py-4 text-[10px] text-gray-400 flex items-center justify-between uppercase tracking-tighter">
        <span>v2.2 PRO Edition • Layout Tuned</span>
        <span>© 2024 Gerador de Etiquetas</span>
      </footer>
    </div>
  );
}
