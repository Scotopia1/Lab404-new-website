declare module 'juice' {
  interface JuiceOptions {
    applyStyleTags?: boolean;
    removeStyleTags?: boolean;
    preserveMediaQueries?: boolean;
    preserveFontFaces?: boolean;
    preserveKeyFrames?: boolean;
    preservePseudos?: boolean;
    insertPreservedExtraCss?: boolean;
    extraCss?: string;
    applyWidthAttributes?: boolean;
    applyHeightAttributes?: boolean;
    applyAttributesTableElements?: boolean;
    webResources?: {
      images?: boolean | number;
      relativeTo?: string;
      rebase?: boolean;
    };
    inlinePseudoElements?: boolean;
    xmlMode?: boolean;
    preserveImportant?: boolean;
  }

  function juice(html: string, options?: JuiceOptions): string;

  export = juice;
}
