import { IconLibraryId, IconLibraryMeta } from "@models/designSystem";

export const iconLibraries: Record<IconLibraryId, IconLibraryMeta> = {
  lucide: {
    id: "lucide",
    name: "Lucide",
    repoUrl: "https://lucide.dev/",
    figmaUrl: "https://www.figma.com/community/plugin/939567362549682378/Lucide-Icons"
  },
  heroicons: {
    id: "heroicons",
    name: "Heroicons",
    repoUrl: "https://heroicons.com/",
    figmaUrl: "https://www.figma.com/community/file/1058824038701535210/Heroicons"
  },
  "material-symbols": {
    id: "material-symbols",
    name: "Material Symbols",
    repoUrl: "https://fonts.google.com/icons",
    figmaUrl: "https://www.figma.com/community/plugin/1033365300214685992/Material-Symbols"
  },
  phosphor: {
    id: "phosphor",
    name: "Phosphor Icons",
    repoUrl: "https://phosphoricons.com/",
    figmaUrl: "https://www.figma.com/community/plugin/898620911119764980/Phosphor-Icons"
  },
  feather: {
    id: "feather",
    name: "Feather Icons",
    repoUrl: "https://feathericons.com/",
    figmaUrl: "https://www.figma.com/community/plugin/744047966581015514/Feather-Icons"
  },
  iconoir: {
    id: "iconoir",
    name: "Iconoir",
    repoUrl: "https://iconoir.com/",
    figmaUrl: "https://www.figma.com/community/plugin/1032295669900064638/Iconoir"
  },
  tabler: {
    id: "tabler",
    name: "Tabler Icons",
    repoUrl: "https://tabler.io/icons",
    figmaUrl: "https://www.figma.com/community/plugin/1039031205606069538/Tabler-Icons"
  },
  streamline: {
    id: "streamline",
    name: "Streamline Icons",
    repoUrl: "https://www.streamlinehq.com/icons",
    figmaUrl: "https://www.figma.com/community/plugin/743034140212392444/Streamline-Icons"
  },
  "noun-project": {
    id: "noun-project",
    name: "Noun Project",
    repoUrl: "https://thenounproject.com/",
    figmaUrl: "https://www.figma.com/community/plugin/744902567238396221/Noun-Project"
  }
};

export const iconLibraryIds: IconLibraryId[] = Object.keys(iconLibraries) as IconLibraryId[];

export const defaultSemanticNames: string[] = [
  "icon.search",
  "icon.close",
  "icon.add",
  "icon.delete",
  "icon.chevron-down",
  "icon.chevron-right",
  "icon.info",
  "icon.warning",
  "icon.success"
];
