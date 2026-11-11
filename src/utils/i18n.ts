export type LanguageCode = 'en' | 'es' | 'pt' | 'de' | 'fr' | 'ja';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    heroTitle: "Universal Clipboard Protocol",
    heroSubtitle: "Transfer text, code snippets, and files instantly across any device with 8-character codes.",
    product: "Product",
    pricing: "Pricing",
    upgrade: "Upgrade",
    goProMax: "Go Pro Max",
    sendShare: "Send / Share",
    receiveRetrieve: "Receive / Retrieve",
    enterCodePlaceholder: "Enter 8-character code...",
    retrieveBtn: "Retrieve Clip",
    textTab: "Text / Code",
    fileTab: "File Transfer",
    cloudTab: "Cloud Storage",
    textPlaceholder: "Paste or type text, code, URLs, or notes here...",
    createClipBtn: "Create Universal Clip",
    uploadFilesBtn: "Upload File(s)",
    dropFilesHere: "Drop files here or click to browse",
    securityTitle: "Security",
    securityDesc: "End-to-end encrypted logic. Clips are automatically purged after expiration.",
    universalTitle: "Universal",
    universalDesc: "Works on any device with a browser. No app installation required.",
    speedTitle: "Speed",
    speedDesc: "Optimized for instant transfers. 8-character codes for maximum efficiency.",
    howItWorks: "How it works",
    privacyTerms: "Privacy & Terms",
    restorePurchases: "Restore Purchases",
    language: "Language",
    login: "Sign In",
    logout: "Sign Out",
  },
  es: {
    heroTitle: "Protocolo de Portapapeles Universal",
    heroSubtitle: "Transfiere texto, código y archivos al instante entre cualquier dispositivo con códigos de 8 caracteres.",
    product: "Producto",
    pricing: "Precios",
    upgrade: "Actualizar",
    goProMax: "Ir a Pro Max",
    sendShare: "Enviar / Compartir",
    receiveRetrieve: "Recibir / Obtener",
    enterCodePlaceholder: "Introduce código de 8 caracteres...",
    retrieveBtn: "Obtener Portapapeles",
    textTab: "Texto / Código",
    fileTab: "Transferencia de Archivos",
    cloudTab: "Almacenamiento Nube",
    textPlaceholder: "Pega o escribe texto, código, enlaces o notas aquí...",
    createClipBtn: "Crear Clip Universal",
    uploadFilesBtn: "Subir Archivo(s)",
    dropFilesHere: "Suelte archivos aquí o haga clic para buscar",
    securityTitle: "Seguridad",
    securityDesc: "Cifrado de extremo a extremo. Los clips se eliminan automáticamente tras caducar.",
    universalTitle: "Universal",
    universalDesc: "Funciona en cualquier dispositivo con navegador. Sin instalación de apps.",
    speedTitle: "Velocidad",
    speedDesc: "Optimizado para transferencias instantáneas. Códigos de 8 caracteres para máxima rapidez.",
    howItWorks: "Cómo funciona",
    privacyTerms: "Privacidad y Términos",
    restorePurchases: "Restaurar Compras",
    language: "Idioma",
    login: "Iniciar Sesión",
    logout: "Cerrar Sesión",
  },
  pt: {
    heroTitle: "Protocolo de Área de Transferência Universal",
    heroSubtitle: "Transfira textos, códigos e arquivos instantaneamente em qualquer dispositivo usando códigos de 8 caracteres.",
    product: "Produto",
    pricing: "Preços",
    upgrade: "Atualizar",
    goProMax: "Ir para o Pro Max",
    sendShare: "Enviar / Compartilhar",
    receiveRetrieve: "Receber / Obter",
    enterCodePlaceholder: "Digite o código de 8 caracteres...",
    retrieveBtn: "Obter Clip",
    textTab: "Texto / Código",
    fileTab: "Transferência de Arquivo",
    cloudTab: "Nuvem",
    textPlaceholder: "Cole ou digite texto, código, URLs ou anotações aqui...",
    createClipBtn: "Criar Clip Universal",
    uploadFilesBtn: "Enviar Arquivo(s)",
    dropFilesHere: "Arraste arquivos aqui ou clique para selecionar",
    securityTitle: "Segurança",
    securityDesc: "Criptografia ponta a ponta. Os clips são excluídos automaticamente após a expiração.",
    universalTitle: "Universal",
    universalDesc: "Funciona em qualquer dispositivo com navegador. Sem necessidade de instalação.",
    speedTitle: "Velocidade",
    speedDesc: "Otimizado para transferências instantâneas. Códigos de 8 caracteres para máxima eficiência.",
    howItWorks: "Como funciona",
    privacyTerms: "Privacidade e Termos",
    restorePurchases: "Restaurar Compras",
    language: "Idioma",
    login: "Entrar",
    logout: "Sair",
  },
  de: {
    heroTitle: "Universelles Zwischenablage-Protokoll",
    heroSubtitle: "Übertragen Sie Texte, Code-Snippets und Dateien sofort auf jedes Gerät mit 8-stelligen Codes.",
    product: "Produkt",
    pricing: "Preise",
    upgrade: "Upgrade",
    goProMax: "Zu Pro Max",
    sendShare: "Senden / Teilen",
    receiveRetrieve: "Empfangen / Abrufen",
    enterCodePlaceholder: "8-stelligen Code eingeben...",
    retrieveBtn: "Clip Abrufen",
    textTab: "Text / Code",
    fileTab: "Dateiübertragung",
    cloudTab: "Cloud-Speicher",
    textPlaceholder: "Fügen Sie Text, Code, URLs oder Notizen hier ein...",
    createClipBtn: "Universellen Clip Erstellen",
    uploadFilesBtn: "Datei(en) Hochladen",
    dropFilesHere: "Dateien hier ablegen oder klicken zum Durchsuchen",
    securityTitle: "Sicherheit",
    securityDesc: "Ende-zu-Ende-verschlüsselt. Clips werden nach Ablauf automatisch gelöscht.",
    universalTitle: "Universell",
    universalDesc: "Funktioniert auf jedem Gerät mit Browser. Keine App-Installation erforderlich.",
    speedTitle: "Geschwindigkeit",
    speedDesc: "Optimiert für sofortige Übertragungen. 8-stellige Codes für maximale Effizienz.",
    howItWorks: "So funktioniert es",
    privacyTerms: "Datenschutz & AGB",
    restorePurchases: "Käufe Wiederherstellen",
    language: "Sprache",
    login: "Anmelden",
    logout: "Abmelden",
  },
  fr: {
    heroTitle: "Protocole de Presse-Papiers Universel",
    heroSubtitle: "Transférez du texte, des extraits de code et des fichiers instantanément sur n'importe quel appareil avec des codes à 8 caractères.",
    product: "Produit",
    pricing: "Tarifs",
    upgrade: "Mettre à niveau",
    goProMax: "Passer à Pro Max",
    sendShare: "Envoyer / Partager",
    receiveRetrieve: "Recevoir / Récupérer",
    enterCodePlaceholder: "Entrez le code à 8 caractères...",
    retrieveBtn: "Récupérer le Clip",
    textTab: "Texte / Code",
    fileTab: "Transfert de Fichiers",
    cloudTab: "Stockage Cloud",
    textPlaceholder: "Collez ou saisissez du texte, du code, des URL ou des notes ici...",
    createClipBtn: "Créer un Clip Universel",
    uploadFilesBtn: "Téléverser des Fichiers",
    dropFilesHere: "Déposez les fichiers ici ou cliquez pour parcourir",
    securityTitle: "Sécurité",
    securityDesc: "Chiffrement de bout en bout. Les clips sont supprimés automatiquement à l'expiration.",
    universalTitle: "Universel",
    universalDesc: "Fonctionne sur tout appareil équipé d'un navigateur. Aucune application requise.",
    speedTitle: "Vitesse",
    speedDesc: "Optimisé pour des transferts instantanés. Codes à 8 caractères pour une rapidité maximale.",
    howItWorks: "Comment ça marche",
    privacyTerms: "Confidentialité & Conditions",
    restorePurchases: "Raurer les Achats",
    language: "Langue",
    login: "Se Connecter",
    logout: "Se Déconnecter",
  },
  ja: {
    heroTitle: "ユニバーサルクリップボードプロトコル",
    heroSubtitle: "8文字のコードで、テキスト、コードスニペット、ファイルをあらゆるデバイス間で即座に転送。",
    product: "機能",
    pricing: "料金プラン",
    upgrade: "アップグレード",
    goProMax: "Pro Maxに変更",
    sendShare: "送信 / 共有",
    receiveRetrieve: "受信 / 取得",
    enterCodePlaceholder: "8文字のコードを入力...",
    retrieveBtn: "クリップを取得",
    textTab: "テキスト / コード",
    fileTab: "ファイル転送",
    cloudTab: "クラウドストレージ",
    textPlaceholder: "テキスト、コード、URL、メモをここに貼り付け...",
    createClipBtn: "ユニバーサルクリップを作成",
    uploadFilesBtn: "ファイルをアップロード",
    dropFilesHere: "ファイルをここにドロップまたはクリックして参照",
    securityTitle: "セキュリティ",
    securityDesc: "エンドツーエンド暗号化。期限切れ後、クリップは自動的に削除されます。",
    universalTitle: "ユニバーサル",
    universalDesc: "ブラウザを搭載したあらゆるデバイスで機能。アプリのインストールは不要です。",
    speedTitle: "超高速",
    speedDesc: "即時転送に最適化。最大の効率を実現する8文字のコード。",
    howItWorks: "使い方",
    privacyTerms: "プライバシーと利用規約",
    restorePurchases: "購入の復元",
    language: "言語",
    login: "ログイン",
    logout: "ログアウト",
  }
};

export function getInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('sendarro_language') as LanguageCode;
  if (saved && translations[saved]) return saved;

  const browserLang = navigator.language?.slice(0, 2).toLowerCase() as LanguageCode;
  if (browserLang && translations[browserLang]) return browserLang;

  return 'en';
}

export function setAppLanguage(lang: LanguageCode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    localStorage.setItem('sendarro_language', lang);
    updateHreflangTags(lang);
  }
}

export function updateHreflangTags(currentLang: LanguageCode): void {
  if (typeof document === 'undefined') return;
  
  // Clean old alternate link tags
  const existingLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingLinks.forEach(el => el.remove());

  const baseUrl = window.location.origin;

  SUPPORTED_LANGUAGES.forEach(langOpt => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = langOpt.code;
    link.href = `${baseUrl}/?lang=${langOpt.code}`;
    document.head.appendChild(link);
  });

  // Default x-default tag for SEO
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = `${baseUrl}/`;
  document.head.appendChild(defaultLink);
}
