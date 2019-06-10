
Name: ws-dazzler-edit
Version: 0.1.0
Release: 13%{?dist}
Group: Application/Web
License: Internal BBC use only
Summary: ws-dazzler-edit
Source0: bake-scripts.tar.gz
Source1: build.tar.gz
Requires: nginx, cloud-httpd24-ssl-services-devs-staff
BuildRoot: %(mktemp -ud %{_tmppath}/%{name}-%{version}-%{release}-XXXXXX)
BuildArch: noarch



%description
ws-dazzler-edit built by the Spectacle

%prep
%setup -T -c spectacle

%build
mkdir -p %{_builddir}/bake-scripts
tar -C %{_builddir}/bake-scripts -xzf %{SOURCE0}
mkdir -p %{_builddir}/build
tar -C %{_builddir}/build -xzf %{SOURCE1}

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
