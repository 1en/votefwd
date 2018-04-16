/*
  Transform a csv to jsonl
  */
'use strict';

const fs = require('fs');
const parse = require('csv-parse');
const through2 = require('through2');

if (process.argv.length != 4) {
  console.log('usage: ./csv-to-jsonl.js INFILE OUTFILE')
  process.exit();
}

const inputFilePath = process.argv[2];
const outputFilePath= process.argv[3];

const fileStream = fs.createReadStream(inputFilePath);
const writeStream = fs.createWriteStream(outputFilePath);
writeStream.on('error', function(err) {
  console.log("err:", err);
});

const parser = parse({columns: true})

var stringifyObject = through2.obj(function(data, _, callback) {
  this.push(JSON.stringify(data, 'utf8') + '\n');
  callback();
})

fileStream
  .pipe(parser)
  .pipe(stringifyObject)
  .pipe(writeStream);
