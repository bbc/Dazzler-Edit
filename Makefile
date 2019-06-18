.PHONY: all clean npm-install prepare local release deploy-int test run-local ensure_centos

# PLEASE CHANGE THE COMPONENT NAME
COMPONENT="dazzler-edit"

all: local

test: ensure_centos
	# Install all dependencies for test, including devDependencies
	npm install --prefix src --no-bin-links
	# Run the tests in a centos7 mock environment for access to a newer version of node
	# and to more closely mimic the target environment
	mock-run --os 7 --install "npm" --copyin src src --shell "npm test --prefix src"


clean:
	rm -rf src/node_modules RPMS SRPMS SOURCES


npm-install:
	# Avoid installing the devDependencies with --production
	npm --production --prefix src install --no-bin-links


prepare: npm-install
	# Bundle the source code into a single .tar.gz file, used in
	# combination with the .spec file to create the RPM(s)
	mkdir -p RPMS SRPMS SOURCES
	tar --exclude=".svn" --exclude="*.sw?" --exclude="*.pyc" -czf SOURCES/src.tar.gz src/


local: ensure_centos clean prepare
	# Build an RPM locally without any cosmos interactions
	mock-build --os 7


run-local: npm-install
	cd src && node index.js


ifneq ($(COMPONENT),"cosmos-component-name-goes-here")
release: ensure_centos clean prepare
	# Build the package in an fresh CentOS 7 build environment, containing
	# just the RPMs listed as build dependencies in the .spec file.  See
	# https://github.com/bbc/bbc-mock-tools for more information.  Also
	# adds an extra part to the version string containing an
	# auto-incrementing build number.
	mock-build --os 7 --define "buildnum $(shell cosmos-release generate-version $(COMPONENT))"
	# Send the RPM and other release metadata to Cosmos.  See
	# https://github.com/bbc/cosmos-release/ for more information
	cosmos-release service $(COMPONENT) RPMS/*.rpm

deploy_int: ensure_centos
	cosmos deploy $(COMPONENT) int -f
	cosmos deploy-progress $(COMPONENT) int
else
release:
	@echo "You need to change the COMPONENT variable in the Makefile before creating a release or deploymnet or your rpm won't be deployed properly!"
	@exit 1

deploy_int:
	@echo "You need to change the COMPONENT variable in the Makefile before creating a release or deploymnet or your rpm won't be deployed properly!"
	@exit 1
endif

ensure_centos:
	@which rpm || (echo "You need to be running linux (sandbox / jenkins) to use the Cosmos CLI, mock-run and mock-build or to test under NodeJS" ; echo "You might need to run 'sudo yum install bbc-mock-tools cosmos-cli' on a sandbox" ; exit 1)
