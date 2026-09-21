export function collectCssFromJsGraph(
  file,
  metafile,
  options = { followDynamic: true },
  seenJs = new Set(),
  seenCss = new Set(),
) {
  if (seenJs.has(file) || !metafile.outputs[file]) {
    return [];
  }

  seenJs.add(file);

  const output = metafile.outputs[file];
  const cssFiles = [];

  if (output.cssBundle) {
    cssFiles.push(...collectCssOutputs(output.cssBundle, metafile, seenCss));
  }

  for (const entry of output.imports ?? []) {
    const follow =
      entry.kind !== 'dynamic-import' || options.followDynamic === true;

    if (!follow) {
      continue;
    }

    if (entry.path.endsWith('.css')) {
      cssFiles.push(...collectCssOutputs(entry.path, metafile, seenCss));
      continue;
    }

    if (entry.path.endsWith('.js')) {
      cssFiles.push(
        ...collectCssFromJsGraph(
          entry.path,
          metafile,
          options,
          seenJs,
          seenCss,
        ),
      );
    }
  }

  return cssFiles;
}

function collectCssOutputs(file, metafile, seen = new Set()) {
  if (seen.has(file)) {
    return [];
  }

  seen.add(file);

  if (!metafile.outputs[file]) {
    return file.endsWith('.css') ? [file] : [];
  }

  return [
    ...(file.endsWith('.css') ? [file] : []),
    ...(metafile.outputs[file].imports ?? []).flatMap((entry) =>
      collectCssOutputs(entry.path, metafile, seen),
    ),
  ].filter((outputFile) => outputFile.endsWith('.css'));
}
