
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import qrcode
from PIL import Image, ImageTk, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import os
import uuid

class GeradorEtiquetasApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Gerador de Etiquetas Pro - 10x10cm")
        self.root.geometry("900x650")
        self.root.configure(bg="#f0f4f8")
        
        self.batch = []
        self.preview_img = None
        
        self.setup_ui()
        
    def setup_ui(self):
        # Estilo
        style = ttk.Style()
        style.configure("TFrame", background="#f0f4f8")
        style.configure("Card.TFrame", background="white", relief="flat")
        
        # Header
        header = tk.Frame(self.root, bg="#1e293b", height=60)
        header.pack(fill="x")
        tk.Label(header, text="GERADOR DE ETIQUETAS PRO", bg="#1e293b", fg="white", 
                 font=("Inter", 14, "bold")).pack(pady=15, padx=20, side="left")
        tk.Label(header, text="v2.2 - 10x10cm", bg="#1e293b", fg="#94a3b8", 
                 font=("Inter", 10)).pack(pady=15, padx=20, side="right")

        main_container = tk.Frame(self.root, bg="#f0f4f8")
        main_container.pack(fill="both", expand=True, padx=20, pady=20)

        # Coluna Esquerda: Formulário
        left_col = tk.Frame(main_container, bg="#f0f4f8")
        left_col.pack(side="left", fill="both", expand=True, padx=(0, 10))

        form_card = tk.Frame(left_col, bg="white", padx=20, pady=20, highlightthickness=1, highlightbackground="#e2e8f0")
        form_card.pack(fill="x", pady=(0, 15))

        tk.Label(form_card, text="USUÁRIO", bg="white", fg="#94a3b8", font=("Inter", 8, "bold")).pack(anchor="w")
        self.ent_user = tk.Entry(form_card, font=("Inter", 12), bg="#f8fafc", relief="flat", highlightthickness=1, highlightbackground="#cbd5e1")
        self.ent_user.pack(fill="x", pady=(5, 15), ipady=8)
        self.ent_user.bind("<KeyRelease>", lambda e: self.update_preview())

        tk.Label(form_card, text="SENHA PROVISÓRIA", bg="white", fg="#94a3b8", font=("Inter", 8, "bold")).pack(anchor="w")
        self.ent_pass = tk.Entry(form_card, font=("Inter", 12), bg="#f8fafc", relief="flat", highlightthickness=1, highlightbackground="#cbd5e1")
        self.ent_pass.pack(fill="x", pady=(5, 15), ipady=8)
        self.ent_pass.bind("<KeyRelease>", lambda e: self.update_preview())

        # Botões
        btn_individual = tk.Button(left_col, text="Gerar PDF Individual", bg="#334155", fg="white", 
                                   font=("Inter", 10, "bold"), relief="flat", command=self.save_individual, cursor="hand2")
        btn_individual.pack(fill="x", pady=5, ipady=10)

        btn_add = tk.Button(left_col, text="Adicionar ao Lote", bg="#0ea5e9", fg="white", 
                            font=("Inter", 10, "bold"), relief="flat", command=self.add_to_batch, cursor="hand2")
        btn_add.pack(fill="x", pady=5, ipady=10)

        btn_batch = tk.Button(left_col, text="Salvar Lote em PDF", bg="#94a3b8", fg="white", 
                              font=("Inter", 10, "bold"), relief="flat", command=self.save_batch, cursor="hand2")
        btn_batch.pack(fill="x", pady=(20, 5), ipady=10)

        # Coluna Central: Preview
        mid_col = tk.Frame(main_container, bg="#f0f4f8")
        mid_col.pack(side="left", padx=20)
        
        self.preview_label = tk.Label(mid_col, bg="white", highlightthickness=2, highlightbackground="#e2e8f0")
        self.preview_label.pack()
        tk.Label(mid_col, text="PREVIEW REAL 10x10cm", bg="#f0f4f8", fg="#64748b", font=("Inter", 8, "bold")).pack(pady=10)

        # Coluna Direita: Lista de Lote
        right_col = tk.Frame(main_container, bg="white", width=250, highlightthickness=1, highlightbackground="#e2e8f0")
        right_col.pack(side="right", fill="both")
        right_col.pack_propagate(False)

        tk.Label(right_col, text="FILA DE LOTE", bg="white", font=("Inter", 9, "bold"), pady=15).pack()
        
        self.listbox = tk.Listbox(right_col, font=("Inter", 9), relief="flat", borderwidth=0, selectmode="single")
        self.listbox.pack(fill="both", expand=True, padx=10, pady=10)
        
        btn_remove = tk.Button(right_col, text="Remover Selecionado", bg="#ef4444", fg="white", font=("Inter", 8), command=self.remove_from_batch)
        btn_remove.pack(fill="x", padx=10, pady=10)

        self.update_preview()

    def generate_label_image(self, user, pwd):
        # 10x10cm a 300 DPI = 1181x1181 pixels
        size = 1181
        img = Image.new('RGB', (size, size), color='white')
        draw = ImageDraw.Draw(img)
        
        try:
            # Tenta carregar uma fonte, senão usa padrão
            font_label = ImageFont.truetype("arial.ttf", 30)
            font_text = ImageFont.truetype("arial.ttf", 45)
        except:
            font_label = ImageFont.load_default()
            font_text = ImageFont.load_default()

        def add_qr_section(text_content, label_text, y_offset, sub_offset=0):
            # Label (USUÁRIO / SENHA)
            draw.text((size//2, y_offset), label_text, fill="#94a3b8", anchor="mm", font=font_label)
            
            # QR Code
            qr = qrcode.QRCode(version=1, box_size=12, border=1)
            qr.add_data(text_content if text_content else " ")
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white").resize((400, 400))
            
            img.paste(qr_img, (size//2 - 200, y_offset + 40 + sub_offset))
            
            # Texto em baixo do QR
            draw.text((size//2, y_offset + 460 + sub_offset), text_content if text_content else "Aguardando...", 
                      fill="#334155", anchor="mm", font=font_text)

        # Seção Usuário
        add_qr_section(user, "USUÁRIO", 150)
        
        # Seção Senha - Ajuste solicitado: "Subir somente um pouco"
        # Aplicamos um sub_offset negativo para subir o bloco da senha
        add_qr_section(pwd, "SENHA", 620, sub_offset=-40) 

        return img

    def update_preview(self):
        user = self.ent_user.get()
        pwd = self.ent_pass.get()
        
        full_img = self.generate_label_image(user, pwd)
        # Redimensiona para o preview na tela (ex: 300x300)
        display_img = full_img.resize((350, 350), Image.Resampling.LANCZOS)
        self.preview_tk = ImageTk.PhotoImage(display_img)
        self.preview_label.config(image=self.preview_tk)

    def add_to_batch(self):
        user = self.ent_user.get()
        pwd = self.ent_pass.get()
        if not user or not pwd:
            messagebox.showwarning("Aviso", "Preencha usuário e senha.")
            return
        
        item = {"id": str(uuid.uuid4())[:8], "user": user, "pass": pwd}
        self.batch.append(item)
        self.listbox.insert(tk.END, f"{item['user']} ({item['id']})")
        
        self.ent_user.delete(0, tk.END)
        self.ent_pass.delete(0, tk.END)
        self.update_preview()

    def remove_from_batch(self):
        selection = self.listbox.curselection()
        if selection:
            idx = selection[0]
            self.batch.pop(idx)
            self.listbox.delete(idx)

    def save_individual(self):
        user = self.ent_user.get()
        pwd = self.ent_pass.get()
        if not user or not pwd: return
        
        path = filedialog.asksaveasfilename(defaultextension=".pdf", filetypes=[("PDF files", "*.pdf")])
        if path:
            self.create_pdf(path, [{"user": user, "pass": pwd}])
            messagebox.showinfo("Sucesso", "Etiqueta salva com sucesso!")

    def save_batch(self):
        if not self.batch: return
        path = filedialog.asksaveasfilename(defaultextension=".pdf", filetypes=[("PDF files", "*.pdf")])
        if path:
            self.create_pdf(path, self.batch)
            messagebox.showinfo("Sucesso", f"Lote com {len(self.batch)} etiquetas salvo!")

    def create_pdf(self, path, items):
        # Tamanho 100mm x 100mm
        c = canvas.Canvas(path, pagesize=(100*mm, 100*mm))
        
        for item in items:
            img = self.generate_label_image(item['user'], item['pass'])
            temp_path = f"temp_{uuid.uuid4()}.png"
            img.save(temp_path)
            
            c.drawImage(temp_path, 0, 0, width=100*mm, height=100*mm)
            c.showPage()
            
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
        c.save()

if __name__ == "__main__":
    root = tk.Tk()
    app = GeradorEtiquetasApp(root)
    root.mainloop()
