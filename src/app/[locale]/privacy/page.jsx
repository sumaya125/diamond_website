import LegalPage from "@/components/legal/LegalPage";

const MAIL = '<a class="underline" href="mailto:ammar.alkafaji@gmail.com">ammar.alkafaji@gmail.com</a>';

const COPY = {
  en: {
    dir: "ltr",
    title: "Privacy Policy — Saghchi",
    updated: "Last updated: 17 October 2026",
    back: { href: "/", label: "← Home" },
    sections: [
      { h: "What we collect", p: [
        "When you create an account we store your name, email address, phone number and account type (customer or jeweller). Jewellers may add a shop name, jewellery type and licence number.",
        "If you sign in with Apple or Google we receive only the identity token those services issue (your account identifier and email). We never see your Apple or Google password.",
        "We store the pricing calculations you choose to save and the consultation appointments you request." ] },
      { h: "How we use it", p: [
        "Your data is used only to run the app: to sign you in, show your saved calculations, and let our consultant contact you about appointments you booked.",
        "We do not sell your data, show advertising, or track you across other apps or websites." ] },
      { h: "Where it is stored", p: [
        "Data is stored on our own server, protected by HTTPS. Passwords are hashed with bcrypt and are never stored in readable form." ] },
      { h: "Deleting your account", p: [
        "You can delete your account at any time from <b>Settings → Delete account</b> inside the app. This permanently removes your profile, saved calculations and appointments.",
        `You can also ask us to delete it by writing to ${MAIL}.` ] },
      { h: "Contact", p: [ `Questions about this policy: ${MAIL}.` ] },
    ],
  },
  ar: {
    dir: "rtl",
    title: "سياسة الخصوصية — صاغچي",
    updated: "آخر تحديث: 17 تشرين الأول 2026",
    back: { href: "/ar", label: "→ الرئيسية" },
    sections: [
      { h: "ما الذي نجمعه", p: [
        "عند إنشاء حساب نحفظ اسمك وبريدك الإلكتروني ورقم هاتفك ونوع الحساب (عميل أو جواهرجي). ويمكن للجواهرجي إضافة اسم المحل ونوع المجوهرات ورقم الإجازة.",
        "عند الدخول عبر Apple أو Google نستلم فقط رمز الهوية الذي تصدره تلك الخدمة (معرّف الحساب والبريد)، ولا نطّلع على كلمة المرور أبداً.",
        "نحفظ عمليات التسعير التي تختار حفظها، وطلبات مواعيد الاستشارة التي تحجزها." ] },
      { h: "كيف نستخدمها", p: [
        "تُستخدم بياناتك لتشغيل التطبيق فقط: تسجيل الدخول، وعرض حساباتك المحفوظة، وتمكين المستشار من التواصل معك بشأن مواعيدك.",
        "لا نبيع بياناتك، ولا نعرض إعلانات، ولا نتتبّعك عبر تطبيقات أو مواقع أخرى." ] },
      { h: "أين تُحفظ", p: [ "تُحفظ البيانات على خادمنا الخاص عبر اتصال HTTPS مشفّر، وكلمات المرور مُجزّأة (bcrypt) ولا تُحفظ بصيغة مقروءة." ] },
      { h: "حذف الحساب", p: [
        "يمكنك حذف حسابك في أي وقت من <b>الإعدادات ← حذف الحساب</b> داخل التطبيق، فيُحذف ملفك وحساباتك المحفوظة ومواعيدك نهائياً.",
        `ويمكنك أيضاً طلب الحذف بمراسلتنا على ${MAIL}.` ] },
      { h: "التواصل", p: [ `لأي سؤال حول هذه السياسة: ${MAIL}.` ] },
    ],
  },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: (COPY[locale] ?? COPY.en).title };
}

export default async function Privacy({ params }) {
  const { locale } = await params;
  return <LegalPage {...(COPY[locale] ?? COPY.en)} />;
}
