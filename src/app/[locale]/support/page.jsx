import LegalPage from "@/components/legal/LegalPage";

const MAIL = '<a class="underline" href="mailto:ammar.alkafaji@gmail.com">ammar.alkafaji@gmail.com</a>';

const COPY = {
  en: {
    dir: "ltr",
    title: "Support — Saghchi",
    updated: "We answer within one business day.",
    back: { href: "/", label: "← Home" },
    sections: [
      { h: "Contact us", p: [ `Email ${MAIL} with your question, the email you signed up with, and a screenshot if something looks wrong.` ] },
      { h: "Common questions", p: [
        "<b>Where do prices come from?</b> Diamond prices come from a live market feed, with a built-in estimate when the feed is unreachable; every result shows its source. Metal prices refresh daily.",
        "<b>How do I book a consultation?</b> Open Appointments in the app, pick a time and send the request; the consultant confirms by phone or WhatsApp.",
        "<b>How do I delete my account?</b> Settings → Delete account. See the <a class=\"underline\" href=\"/privacy\">privacy policy</a>." ] },
    ],
  },
  ar: {
    dir: "rtl",
    title: "الدعم — صاغچي",
    updated: "نرد خلال يوم عمل واحد.",
    back: { href: "/ar", label: "→ الرئيسية" },
    sections: [
      { h: "تواصل معنا", p: [ `راسلنا على ${MAIL} مع سؤالك والبريد الذي سجّلت به، وصورة للشاشة إن ظهر خطأ.` ] },
      { h: "أسئلة شائعة", p: [
        "<b>من أين تأتي الأسعار؟</b> أسعار الألماس من مصدر سوق مباشر، مع تقدير مدمج عند تعذّر الوصول إليه، وكل نتيجة تُظهر مصدرها. أسعار المعادن تتحدّث يومياً.",
        "<b>كيف أحجز استشارة؟</b> افتح المواعيد في التطبيق واختر الوقت وأرسل الطلب، ويؤكد المستشار عبر الهاتف أو واتساب.",
        "<b>كيف أحذف حسابي؟</b> الإعدادات ← حذف الحساب. راجع <a class=\"underline\" href=\"/ar/privacy\">سياسة الخصوصية</a>." ] },
    ],
  },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: (COPY[locale] ?? COPY.en).title };
}

export default async function Support({ params }) {
  const { locale } = await params;
  return <LegalPage {...(COPY[locale] ?? COPY.en)} />;
}
