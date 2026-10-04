import "server-only";
export const storeConfig = {
  instagramUrl: "https://www.instagram.com/amoon.collection1/",
  whatsappUrl: /^\d{8,15}$/.test(process.env.WHATSAPP_NUMBER ?? "") ? `https://wa.me/${process.env.WHATSAPP_NUMBER}` : null,
};
