import { fetchPackage } from './fetchPackage';

export default async function downloadTarbal(
  dep: string,
  version: string | null,
): Promise<Response> {
  if (!version) {
    return new Response('Missing version', {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=10',
      },
    });
  }

  const packageJson = await fetchPackage(dep.replace('/download/', ''), true);
  const packageJsonObject = JSON.parse(packageJson);
  const packageVersion = packageJsonObject.versions[version];
  const packageVersionPath = packageVersion.dist.tarball;
  const packageVersionResponse = await fetch(packageVersionPath);

  const encodedFilename = encodeURIComponent(
    packageVersion.name + '-' + version + '.tgz',
  );

  return new Response(packageVersionResponse.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'content-disposition': `attachment; filename*=UTF-8''${encodedFilename}; filename="${encodedFilename}"`,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, inmutable',
    },
  });
}
