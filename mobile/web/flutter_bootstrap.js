{{flutter_js}}
{{flutter_build_config}}

_flutter.loader.load({
  onEntrypointLoaded: async function(engineInitializer) {
    let appRunner = await engineInitializer.initializeEngine({
      hostElement: document.querySelector('#flutter-target'),
    });
    await appRunner.runApp();
  }
});
