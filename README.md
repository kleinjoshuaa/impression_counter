# impression_counter


The Split impressions_counter allows you to essentially 'live stream' from the impressions webhook to see what kind of data you have coming across into your environment on a feature flag by feature flag basis

## Installation
```
git clone https://github.com/kleinjoshuaa/impression_counter.git
cd impression_counter
npm install
```

## Usage
```
node index.js
```
It will serve locally on port 3000

You will need to set up your split impressions webhook to point to your server. Ensure that it's hitting the `/impression` endpoint. 

Then every impression that hits it will increment a counter to show information. 

![dashboard](https://user-images.githubusercontent.com/1207274/200390756-a4e81802-2db5-4bec-b829-1bfab87805bf.gif)
