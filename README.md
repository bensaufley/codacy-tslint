# Codacy TSLint

[![](https://images.microbadger.com/badges/version/nlesc/codacy-tslint.svg)](https://microbadger.com/images/nlesc/codacy-tslint "Docker Hub")

This is the docker engine that can be used by [Codacy](https://www.codacy.com/) to have [TSLint](https://github.com/palantir/tslint) support.

Followed instructions at https://support.codacy.com/hc/en-us/articles/207994725-Tool-Developer-Guide

## Usage

Create Docker container with:
```
docker build -t nlesc/codacy-tslint .
```

Test Docker container with:

```
docker run -t \
--net=none \
--privileged=false \
--cap-drop=ALL \
--user=docker \
--rm=true \
-v <PATH-TO-FOLDER-WITH-FILES-TO-CHECK>:/src:ro \
nlesc/codacy-tslint
```

