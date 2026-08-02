# Flutter plugins register platform channels through generated code.
# Keep their classes during R8 shrinking; app-specific rules should be added here.
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.embedding.** { *; }
