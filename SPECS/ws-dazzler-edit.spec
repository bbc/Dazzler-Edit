
Name: ws-dazzler-edit
Version: 0.1.0
Release: 14%{?dist}
Group: Application/Web
License: Internal BBC use only
Summary: ws-dazzler-edit
Source0: git@github.com:bbc/Dazzler-Edit.git
BuildRequires: npm
Requires: nginx, cloud-httpd24-ssl-services-devs-staff
BuildRoot: %(mktemp -ud %{_tmppath}/%{name}-%{version}-%{release}-XXXXXX)
BuildArch: noarch



%description
Dazzler Edit a schedule editor for Web TV

%prep
echo %{SOURCES0}
rm -rf %{_builddir}/Dazzler-Edit
git clone git@github.com:bbc/Dazzler-Edit.git

%build
cd Dazzler-Edit
npm i
npm run build
tar -C build -czf %{_topdir}/SOURCES/build.tar.gza *
tar -C bake-scripts -czf %{_topdir}/SOURCES/bake-scripts.tar.gza *

%install
mkdir -p %{buildroot}/var/www
cp -R --preserve=timestamps %{_builddir}/build %{buildroot}/var/www/dazzler
mkdir -p %{buildroot}/etc/bake-scripts
cp -R --preserve=timestamps %{_builddir}/bake-scripts %{buildroot}/etc
echo ===============
ls -l %{buildroot}/etc/bake-scripts
echo ===============

%pre

getent group nginx >/dev/null || groupadd -r nginx
getent passwd nginx >/dev/null || \
    useradd -r -g nginx -G nginx -d / -s /sbin/nologin \
    -c "nginx service" nginx


getent group nginx >/dev/null || groupadd -r nginx
getent passwd nginx >/dev/null || \
    useradd -r -g nginx -G nginx -d / -s /sbin/nologin \
    -c "nginx service" nginx


%preun


%post


%postun


%clean
rm -rf %{buildroot}

%files
%defattr(644, root, root, 755)
/var/www/dazzler
%defattr(755, root, root, 755)
/etc/bake-scripts
