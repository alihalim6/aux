import Vue from 'vue';
import Vuetify from 'vuetify';
import path from 'path';
import glob from 'glob';
import {capitalCase} from 'capital-case';

Vue.use(Vuetify);

//adapted from https://stackoverflow.com/questions/64989140/nuxt-jest-unknow-custom-element-if-components-is-not-set
//addresses Nuxt issue of not needing to manually include child components in parent
const fileComponents = glob.sync(path.join(__dirname, '../components/**/*.vue'));

for(const file of fileComponents){
  const name = file.match(/([(\w*)(\.*)]*)\.vue$/)[0];
  const capitalizedName = capitalCase(name.split('.vue')[0]).replaceAll(' ', '');
  //console.log(`${capitalizedName}.vue`);
  Vue.component(capitalizedName, require(file).default);
}