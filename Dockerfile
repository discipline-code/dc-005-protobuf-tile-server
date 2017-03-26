FROM ubuntu:16.04
RUN apt-get update -y \
      && apt-get install -y --no-install-recommends \
      software-properties-common \
      python \
      curl \
      python-pip \
      python-software-properties \
      libstdc++-5-dev \
      zlib1g-dev \
      clang 
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash
RUN apt-get install -y --no-install-recommends nodejs
RUN pip install --upgrade pip
RUN pip install mapnik

ENV HOME=/usr/src
# At the moment we won't have a package.json or
# npm-shrinkwrap.json we will create the files
# in the future
COPY package.json npm-shrinkwrap.json $HOME/app/

WORKDIR $HOME/app
RUN npm install
COPY . $HOME/app

CMD npm run start
EXPOSE 8081
