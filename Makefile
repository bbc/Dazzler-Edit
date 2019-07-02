.PHONY: all clean npm-install prepare local release

# PLEASE CHANGE THE FOLLOWING
COMPONENT="cosmos-component-name-goes-here"

all: local

test:
	# Install all dependencies for test, including devDependencies
	npm install --prefix backend --no-bin-links
	# Run the tests in a centos7 mock environment for access to a newer version of node
	# and to more closely mimic the target environment
	mock-run --os 7 --install "npm" --copyin backend src --shell "npm test --prefix src"

clean:
	rm -rf frontend/node_modules backend/node_modules backend/edit RPMS SRPMS SOURCES

npm-install:
	# Avoid installing the devDependencies with --production
	npm --production --prefix backend install --no-bin-links
	# we need the dev dependencies so we can run the react build script
	npm --prefix frontend install
	cd frontend && npm run-script build


prepare: npm-install
	# Bundle the source code into a single .tar.gz file, used in
	# combination with the .spec file to create the RPM(s)
	cp -a frontend/build/ backend/edit
	mkdir -p RPMS SRPMS SOURCES
	tar --exclude=".svn" --exclude="*.sw?" --exclude="*.pyc" -czf SOURCES/src.tar.gz backend/

local: clean prepare
	# Build an RPM locally without any cosmos interactions
	mock-build --os 7

release: clean prepare
	# Build the package in an fresh CentOS 7 build environment, containing
	# just the RPMs listed as build dependencies in the .spec file.  See
	# https://github.com/bbc/bbc-mock-tools for more information.  Also
	# adds an extra part to the version string containing an
	# auto-incrementing build number.
	mock-build --os 7 --define "buildnum $(shell cosmos-release generate-version $(COMPONENT))"

	# Send the RPM and other release metadata to Cosmos.  See
	# https://github.com/bbc/cosmos-release/ for more information
	cosmos-release service $(COMPONENT) RPMS/*.rpm

deploy_int:
	cosmos deploy $(COMPONENT) int -f
	cosmos deploy-progress $(COMPONENT) int
