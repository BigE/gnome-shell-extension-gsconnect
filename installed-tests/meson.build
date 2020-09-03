installed_tests_execdir = join_paths(libexecdir, 'installed-tests', meson.project_name())
installed_tests_metadir = join_paths(datadir, 'installed-tests', meson.project_name())

installed_tests_srcdir = meson.current_source_dir()
installed_tests_builddir = meson.current_build_dir()
installed_tests_gjspath = join_paths(installed_tests_builddir, 'src')


# meson Test Environment
test_env = environment()
test_env.set('GSCONNECT_TEST', '1')
test_env.set('GJS_PATH', installed_tests_gjspath)
test_env.set('NO_AT_BRIDGE', '1')
test_env.set('GSETTINGS_BACKEND', 'memory')
test_env.set('GSETTINGS_SCHEMA_DIR', installed_tests_builddir)
test_env.set('G_DEBUG', 'fatal-warnings,fatal-criticals')


test_config_js = configure_file(
  input: '../data/config.js.in',
  output: 'config.js',
  configuration: extconfig,
)

installed_tests_prepared = custom_target(
  'prepare-tests',
  build_by_default: true,
           command: [
             env_util,
             'MESON_BUILD_ROOT=' + meson.build_root(),
             'MESON_SOURCE_ROOT=' + meson.source_root(),
             'G_TEST_BUILDDIR=' + installed_tests_builddir,
             'G_TEST_SRCDIR=' + installed_tests_srcdir,
             join_paths(installed_tests_srcdir, 'prepare-tests.sh')
           ],
            output: 'none',
)

# Test Suites
jasmine_tests = [
  'Device',
  'Manager',
  'Packet',
  'Plugin',
  'LanBackend',
  'BatteryPlugin', # TODO upower
  'ClipboardPlugin',
  'ContactsPlugin',
  'FindmyphonePlugin',
  'MousepadPlugin',
  'MprisPlugin',
  'NotificationPlugin',
  'PhotoPlugin',
  'PingPlugin',
  'PresenterPlugin',
  'RuncommandPlugin',
  #'SftpPlugin',
  'SharePlugin',
  'SmsPlugin',
  'SystemvolumePlugin',
  'TelephonyPlugin',
]

jasmine = find_program('jasmine')

if jasmine.found()
  if get_option('installed_tests')
    install_subdir('data',
      install_dir: installed_tests_execdir,
    )

    install_subdir('fixtures',
      install_dir: installed_tests_execdir,
    )

    install_data(test_config_js,
      install_dir: installed_tests_execdir,
    )
  endif

  foreach test : jasmine_tests
    test_file = files('test@0@.js'.format(test))

    test(test, jasmine,
          args: [test_file, '--tap'],
       depends: [installed_tests_prepared],
           env: test_env,
      protocol: 'tap',
         suite: 'service'
    )

    if get_option('installed_tests')
      test_config = configuration_data()
      test_config.set('jasmine_path', jasmine.path())
      test_config.set('name', 'test@0@.js'.format(test))
      test_config.set('installed_tests_execdir', installed_tests_execdir)

      test_description = configure_file(
        configuration: test_config,
                input: 'jasmine.test.in',
               output: 'test@0@.test'.format(test),
          install_dir: installed_tests_metadir
      )

      install_data(test_file,
        install_dir: installed_tests_execdir
      )
    endif
  endforeach
endif

