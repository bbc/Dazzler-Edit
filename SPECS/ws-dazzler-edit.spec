
Name: dazzler-edit
Version: 0.1.1%{?buildnum:.%{buildnum}}
Release: 14%{?dist}
Group: System Environment/Daemons
License: Internal BBC use only
Summary: A dazzler-edit application
Source0: src.tar.gz


Requires: nodejs
Requires: dazzlercapture
Requires: partner-platform-access-proxy
BuildRoot: %(mktemp -ud %{_tmppath}/%{name}-%{version}-%{release}-XXXXXX)
BuildArch: x86_64

BuildRequires: npm
BuildRequires: systemd

%description
A dazzler edit application

%prep
%setup -q -n backend/

%build
npm rebuild

%install
mkdir -p %{buildroot}/usr/lib/systemd/system/
mkdir -p %{buildroot}%{_sysconfdir}/bake-scripts/dazzler
mkdir -p %{buildroot}/usr/lib/dazzler
cp %{_builddir}/backend/index.js %{buildroot}/usr/lib/dazzler
cp -R %{_builddir}/backend/dazzler/ %{buildroot}/usr/lib/dazzler/
cp -R %{_builddir}/backend/edit/ %{buildroot}/usr/lib/dazzler/
cp -R %{_builddir}/backend/node_modules %{buildroot}/usr/lib/dazzler
cp -R %{_builddir}/backend/usr/lib/systemd/system/dazzler-edit.service %{buildroot}/usr/lib/systemd/system/
cp -R %{_builddir}/backend/bake-scripts %{buildroot}%{_sysconfdir}/bake-scripts/dazzler

%pre
getent group dazzler >/dev/null || groupadd -r dazzler
getent passwd dazzler >/dev/null || \
        useradd -r -g dazzler -G dazzler -d / -s /sbin/nologin \
        -c "dazzler node.js service" dazzler

%files
%defattr(644, root, root, 755)
/usr/lib/dazzler
/usr/lib/systemd/system/dazzler-edit.service
%defattr(-, root, root, 755)
/etc/bake-scripts/dazzler
