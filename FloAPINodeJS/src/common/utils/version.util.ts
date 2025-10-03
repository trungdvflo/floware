import compareVersions = require('compare-versions');

export class VersionUtil {
  static getMaxVersion(versions: string[] = []): string {
    if (versions.length <= 0) {
      return '';
    }
    return versions.sort(compareVersions).reverse()[0];
  }

  static compareVersion(v1, v2, operator): boolean {
    return compareVersions.compare(v1, v2, operator);
  }
}