import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Photo } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { Link } from "react-router-dom";
const AppearancePage = () => <Container className="space-y-5"><Heading level="h1">Apparence du site</Heading><Text className="text-ui-fg-subtle">Personnalisez votre boutique, préparez un brouillon et publiez quand vous êtes prêt.</Text><Link to="/appearance/colors" className="block space-y-2 rounded-lg border p-5 hover:bg-ui-bg-subtle"><Heading level="h2">Couleurs & Thème</Heading><Text>Palette, thèmes prédéfinis et aperçu en direct →</Text></Link><Link to="/appearance/homepage" className="block space-y-2 rounded-lg border p-5 hover:bg-ui-bg-subtle"><Heading level="h2">Contenu de l’accueil</Heading><Text>Collections, promotions, annonce et sections →</Text></Link></Container>;
export const config = defineRouteConfig({ label: "Apparence du site", icon: Photo });
export const handle = { breadcrumb: () => "Apparence du site" };
export default AppearancePage;
