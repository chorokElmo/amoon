import { connection } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { parseFilters, selectCatalog } from "@/lib/catalog-model";
import { CatalogCard } from "@/components/catalog/catalog-card";
import { FavoritesGrid } from "@/components/catalog/favorites-grid";
import { CatalogStatus } from "@/components/catalog/catalog-status";
export const metadata={title:"Mes favoris",robots:{index:false,follow:true}};
export default async function FavoritesPage(){await connection();const catalog=await getCatalog();if(!catalog.ok)return <CatalogStatus/>;const items=selectCatalog(catalog.data,parseFilters({}),undefined,1000).items;return <section className="container favorites-page"><p className="eyebrow">Vos coups de cœur</p><h1>Mes favoris.</h1><FavoritesGrid cards={items.map(item=>({id:item.product.id,content:<CatalogCard item={item}/>}))}/></section>;}
