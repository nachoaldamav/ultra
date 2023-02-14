declare module 'bin-links' {
  /**
   * @param path Where the package is installed
   * @param pkg The package.json of the package
   * @param global Install globally
   * @param force Rewrite existing symlinks
   */
  export default function binLinks(opts: {
    path: string;
    pkg: any;
    global?: boolean;
    force?: boolean;
    top?: boolean;
  }): Promise<void>;
}
