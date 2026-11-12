import { getTranslations } from "next-intl/server";
import type { Person } from "@/db/schema";
import { MAP_H, MAP_W, familyPlaces } from "@/lib/family-places";
import { PlacesMapView, type MapLabels } from "./PlacesMapView";

/** Where the family was born, lived and died. Renders nothing when no place can be located. */
export async function PlacesMap({ people, locale }: { people: Person[]; locale: string }) {
  const t = await getTranslations("map");
  const map = familyPlaces(people, locale, t("unknown"));
  if (!map) return null;
  const labels: MapLabels = {
    title: t("title"),
    born: t("born"),
    lived: t("lived"),
    died: t("died"),
    hint: t("hint"),
    zoomIn: t("zoomIn"),
    zoomOut: t("zoomOut"),
    reset: t("reset"),
    unplaced: t("unplaced"),
    show: t("show"),
  };
  return <PlacesMapView map={map} width={MAP_W} height={MAP_H} labels={labels} />;
}
