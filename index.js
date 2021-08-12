const axios = require('axios')
const csv = require('csv-parser')
const DomParser = require('dom-parser')
const fs = require('fs')
const ObjectsToCsv = require('objects-to-csv')

const getAdditionalTransactionInfo = transaction => {
  return axios.get(`https://bscscan.com/tx/${transaction.Txhash}`)
    .then(response => {
      const parser = new DomParser();
      const dom = parser.parseFromString(response.data);
      const valueString = dom.getElementById("ContentPlaceHolder1_spanValue").textContent.trim();
      //console.log(valueString);
      const values = valueString.split("BNB");
      const BnbValue = Number(values[0].trim());
      //console.log("bnb value", bnbValue);
      const UsdValue = Number(values[1].trim()
        .replaceAll("(", "")
        .replaceAll(")", "")
        .replaceAll("$", "")
        .replaceAll(",", "")
      );
      //console.log("usd value", usdValue);
      return {...transaction, ...{ BnbValue, UsdValue }};
    });
}

const appendAdditionalInfo = transactions => {
  const promises = transactions.map(transaction => getAdditionalTransactionInfo(transaction));
  Promise.all(promises).then(values => {
    values.sort((a, b) => Number(a.UnixTimestamp) - Number(b.UnixTimestamp));
    console.log("values", values);
    const csv = new ObjectsToCsv(values);
    csv.toDisk('result.csv').then(() => console.log("finish"));
  });
}

const readCsv = fileName => {
  const results = [];
  fs.createReadStream(fileName)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // console.log(results);
      appendAdditionalInfo(results);
      // [
      //   { NAME: 'Daffy Duck', AGE: '24' },
      //   { NAME: 'Bugs Bunny', AGE: '22' }
      // ]
    });
}

readCsv("0812.csv");
// const result = await getTransactionInfo("0x08f8717a567eb850249ea0247602988429003fb209130648905b9af0ba50066a");

