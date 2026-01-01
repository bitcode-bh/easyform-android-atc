-ignorewarnings
#-keep class * {
#    public private *;
#}
#-keepclasseswithmembernames class com.sky.atc.easyformse.** { *; }
#-keep public class * extends android.app.Activity
#-dontusemixedcaseclassnames
#-dontskipnonpubliclibraryclasses
#-verbose
#-dontwarn **compatHoneycomb
#-dontwarn **compatHoneycombMR2
#-dontwarn **compatCreatorHoneycombMR2
 -keep class org.xmlpull.v1.** { *;}
 -dontwarn org.xmlpull.v1.**
-keep class org.apache.cordova.** { *; }
-keep class net.sqlcipher.** {
    *;
}
-keep class org.apache.cordova.CordovaPlugin
-keep public class * extends org.apache.cordova.CordovaPlugin
-keep public class * extends org.apache.cordova.CordovaActivity
#-keep interface android.support.** { *; }
#-keep class android.support.** { *; }

#-keep class com.itextpdf.text.pdf.** {*;}
#-dontwarn com.itextpdf.text.pdf.**
#-keep class org.joda.convert.** {*;}

-keep class com.google.maps.** { *; }

-keep class org.spongycastle.**
-keep class com.itextpdf.text.pdf.** {*;}

-keep class com.itextpdf.** {
    public class * (android.app.Activity);
}




#-keepclasseswithmembernames class android.support.** { *; }
#-keepclasseswithmembernames interface android.support.** { *; }
#-applymapping mapping.txt

#-keepclasseswithmembernames class * {
#   native <methods>;
#}
#-keepclasseswithmembernames class * {
#   public <init>(android.content.Context,android.util.AttributeSet);
#}

#-dontwarn butterknife.internal.**
#-keep class butterknife.** { *; }
#-keep class **$$ViewInjector { *; }
#-keepclasseswithmembernames class * {
#    @butterknife.InjectView <fields>;
#}
#-keepclasseswithmembernames class * {
#    @butterknife.OnClick <methods>;
#    @butterknife.OnEditorAction <methods>;
#    @butterknife.OnItemClick <methods>;
#    @butterknife.OnItemLongClick <methods>;
#    @butterknife.OnLongClick <methods>;
#}
#
# This is a configuration file for ProGuard.
# http://proguard.sourceforge.net/index.html#manual/usage.html
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose

-assumenosideeffects class android.util.Log {
 public static *** d(...);
 public static *** i(...);
 public static *** v(...);
 public static *** e(...);
}
-repackageclasses 'o'

# Optimization is turned off by default. Dex does not like code run
# through the ProGuard optimize and preverify steps (and performs some
# of these optimizations on its own).
#-dontoptimize
#-dontpreverify

# If you want to enable optimization, you should include the
# following:
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
#
# Note that you cannot just include these flags in your own
# configuration file; if you are including this file, optimization
# will be turned off. You'll need to either edit this file, or
# duplicate the contents of this file and remove the include of this
# file from your project's proguard.config path property.

-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends android.app.backup.BackupAgent
-keep public class * extends android.preference.Preference
-keep public class * extends android.support.v4.app.Fragment
-keep public class * extends android.support.v4.app.DialogFragment
-keep public class * extends com.actionbarsherlock.app.SherlockListFragment
-keep public class * extends com.actionbarsherlock.app.SherlockFragment
-keep public class * extends com.actionbarsherlock.app.SherlockFragmentActivity
-keep public class * extends android.app.Fragment
-keep public class com.android.vending.licensing.ILicensingService

# For native methods, see http://proguard.sourceforge.net/manual/examples.html#native
-keepclasseswithmembernames class * {
 native <methods>;
}

-keep public class * extends android.view.View {
 public <init>(android.content.Context);
 public <init>(android.content.Context, android.util.AttributeSet);
 public <init>(android.content.Context, android.util.AttributeSet, int);
 public void set*(...);
}

-keepclasseswithmembers class * {
 public <init>(android.content.Context, android.util.AttributeSet);
}

-keepclasseswithmembers class * {
 public <init>(android.content.Context, android.util.AttributeSet, int);
}

-keepclassmembers class * extends android.app.Activity {
 public void *(android.view.View);
}

# For enumeration classes, see http://proguard.sourceforge.net/manual/examples.html#enumerations
-keepclassmembers enum * {
 public static **[] values();
 public static ** valueOf(java.lang.String);
}

-keep class * implements android.os.Parcelable {
 public static final android.os.Parcelable$Creator *;
}

-keepclassmembers class **.R$* {
 public static <fields>;
}

-keep class android.support.v4.app.** { *; }
-keep interface android.support.v4.app.** { *; }
-keep class com.actionbarsherlock.** { *; }
-keep interface com.actionbarsherlock.** { *; }
# The support library contains references to newer platform versions.
# Don't warn about those in case this app is linking against an older
# platform version. We know about them, and they are safe.
-dontwarn android.support.**
-dontwarn com.google.ads.**

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
-keep,allowobfuscation interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation interface com.facebook.common.internal.DoNotStrip

# Do not strip any method/class that is annotated with @DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.UIProp <fields>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }

# okhttp

-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# okio

-keep class sun.misc.Unsafe { *; }
-dontwarn java.nio.file.*
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-keep class okio.** { *; }
-dontwarn okio.**

# WebRTC

-keep class org.webrtc.** { *; }
-dontwarn org.chromium.build.BuildHooksAndroid

# Jisti Meet SDK

-keep class org.jitsi.meet.sdk.** { *; }

# We added the following when we switched minifyEnabled on. Probably because we
# ran the app and hit problems...

-keep class com.facebook.react.bridge.CatalystInstanceImpl { *; }
-keep class com.facebook.react.bridge.ExecutorToken { *; }
-keep class com.facebook.react.bridge.JavaScriptExecutor { *; }
-keep class com.facebook.react.bridge.ModuleRegistryHolder { *; }
-keep class com.facebook.react.bridge.ReadableType { *; }
-keep class com.facebook.react.bridge.queue.NativeRunnable { *; }
-keep class com.facebook.react.devsupport.** { *; }

-dontwarn com.facebook.react.devsupport.**
-dontwarn com.google.appengine.**
-dontwarn com.squareup.okhttp.**
-dontwarn javax.servlet.**
-dontwarn com.sun.javadoc.Doclet
# ^^^ We added the above when we switched minifyEnabled on.

# Rule to avoid build errors related to SVGs.
-keep public class com.horcrux.svg.** {*;}

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }

# This app
-keep class com.easyform.jitsi.** { *; }

-keep class com.coremedia.iso.** { *; }
-keep class com.googlecode.mp4parser.** { *; }
-dontwarn com.coremedia.iso.**
-dontwarn com.googlecode.mp4parser.**

-dontwarn org.xmlpull.v1.**
-dontwarn org.kxml2.io.**
-dontwarn android.content.res.**
-dontwarn org.slf4j.impl.StaticLoggerBinder

-keep class org.xmlpull.** { *; }
-keepclassmembers class org.xmlpull.** { *; }

-keep class io.surepass.** { *; }
-dontwarn io.surepass.**
-keep class * extends android.app.Activity { *; }
-keep class com.google.gson.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keepattributes *Annotation*
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-keep class org.apache.cordova.** { *; }