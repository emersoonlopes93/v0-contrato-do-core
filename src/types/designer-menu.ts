export type DesignerMenuHeaderVariant = 'default' | 'solid-primary';

export type DesignerMenuLayoutMode = 'grid' | 'list' | 'compact';

export type DesignerMenuImageStyle = 'square' | 'rectangle' | 'rounded' | 'full-bleed';

export type SafeColorPalette = 
  | 'white'
  | 'black'
  | 'blue'
  | 'green' 
  | 'red'
  | 'yellow'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'gray';

export type DesignerMenuConfigDTO = {
  headerVariant: DesignerMenuHeaderVariant;
  layoutMode: DesignerMenuLayoutMode;
  showSearchBar: boolean;
  showAddButton: boolean;
  showWelcomeMessage: boolean;
  imageStyle: DesignerMenuImageStyle;
  
  // Cores
  headerTextColor: SafeColorPalette;
  headerButtonColor: SafeColorPalette;
  logoBackgroundColor: SafeColorPalette;
  groupTitleBackgroundColor: SafeColorPalette;
  welcomeBackgroundColor: SafeColorPalette;
  welcomeTextColor: SafeColorPalette;
  
  // Ícones
  customIcons: Array<{
    id: string;
    name: string;
    url: string;
    fileType: 'svg' | 'png';
    width: number;
    height: number;
  }>;
};

export type DesignerMenuStoredConfig = {
  tenantSlug: string;
  config: DesignerMenuConfigDTO;
};
