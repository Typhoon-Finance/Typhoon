import './StrategizerTable.css'
import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import env from "react-dotenv";
import axios from 'axios';

console.log('key is: ', env.CRYPTO_COMPARE_KEY)

// const GET_PRICES_REFRESH_SECONDS = 11;
const GET_PRICES_REFRESH_SECONDS = 100;

// const client = new W3CWebSocket('wss://streamer.cryptocompare.com/v2?apikey=' + env.CRYPTO_COMPARE_KEY);

const tickers = ['WETH', 'WBTC', 'USDT', 'DIGG', 'LTC', 'DOGE', 'SOL', 'ADA', 'DAI', 'SAI', 'BADGER', 'ETH', 'MANA', 'MATIC', 'SUSHI', 'XRP', 'DOT', 'UNI', 'LINK', 'BCH'];

const stringifiedTickers = tickers.join(',')

const exchanges = ['sushiswap', 'uniswapv2'];

const stringifiedExchanges = exchanges.join(',');

const borrowAmount = 100;

const handpickedStrategies = [
  ['WETH', 'WBTC', 'DIGG', 'WETH'],
  ['WETH', 'WBTC', 'BADGER', 'WETH'],
  ['WETH', 'WBTC', 'DAI', 'WETH'],
  ['WETH', 'DIGG', 'WBTC', 'WETH'],
  ['WETH', 'BADGER', 'WBTC', 'WETH'],
  ['WETH', 'DAI', 'WBTC', 'WETH'],
  ['WETH', 'UNI', 'LINK', 'WETH'],
  ['WETH', 'LINK', 'UNI', 'WETH']
]

const ccPriceMultiBaseUrl = 'https://min-api.cryptocompare.com/data/pricemulti';

class StrategizerTable extends Component {

  gudStuff = 'foo';

  constructor(props) {

    super(props);
    this.state = {
      latestPrices: {},
      countdownText: 0,
      rankedStrategies: []
    }

  }

  componentWillMount() {

    setInterval(() => {

      let newCountdownText = +this.state.countdownText - 1;

      if (+newCountdownText % GET_PRICES_REFRESH_SECONDS <= 0) {
        newCountdownText = "calling!"
        newCountdownText = GET_PRICES_REFRESH_SECONDS

        const promises = []

        exchanges.forEach((exchange, index) => {
          console.log('calling ' + exchange + '...')

          this.setState({
            latestPrices: [],
            countdownText: newCountdownText
          })

          promises.push(axios.get(`${ccPriceMultiBaseUrl}?fsyms=${stringifiedTickers}&tsyms=${stringifiedTickers}&e=${exchange}`))

        })

        Promise.all(promises).then(responses => {

          const calculatedStrategies = this.calculateStrategies(handpickedStrategies, exchanges, responses);

          const rankedStrategies = calculatedStrategies.sort((a, b) => b.netProfit - a.netProfit)

          this.setState({
            latestPrices: responses,
            countdownText: newCountdownText,
            rankedStrategies
          })

        })

      } else {
        this.setState({
          countdownText: newCountdownText
        })
      }

    }, 1000)

  }

  calculateStrategies(handpickedStrategies, exchanges, priceData) {

    return handpickedStrategies.map(strategyTokens => {

      console.log('calling with: ', strategyTokens)

      const { exchangeChoices, exchangePrices } = this.getExchangesWithCheapestPrice(exchanges, priceData, strategyTokens);
      const netProfit = this.calcualteNetProfitOfStrategy(borrowAmount, exchangePrices);

      return {
        tokens: strategyTokens,
        exchangeChoices,
        netProfit
      }

    })

  }

  getExchangesWithCheapestPrice(exchanges, priceData, strategyTokens) {

    const resultExchanges = []
    const resultPrices = []

    strategyTokens.forEach((fromToken, tokenIndex) => {

      if (tokenIndex >= 0 && tokenIndex < strategyTokens.length - 1) {
        console.log(' exchanges, price data: ', priceData);

        const toToken = strategyTokens[tokenIndex + 1];
        console.log('from token: ', fromToken, ' to token: ', toToken);

        const bestSwapPrices = [];

        let exchangePricesForSwap = [];

        console.log('exchanges are: ', exchanges)

        exchanges.forEach((exchangeToCheck, exchangeIndex) => {

          console.log('checking exchange: ', exchangeToCheck)

          if (priceData[exchangeIndex] && priceData[exchangeIndex].data[fromToken] &&
            priceData[exchangeIndex].data[fromToken][toToken]) {

            const price = priceData[exchangeIndex].data[fromToken][toToken]

            console.log(price)
            console.log(typeof price)
            console.log(`price exists for ${fromToken} to ${toToken} on ${exchangeToCheck}: ${price}`);
            exchangePricesForSwap.push(price);

            console.log('k ' + exchangePricesForSwap)

          }

          // check for reverse price and invert it
          else if (priceData[exchangeIndex] && priceData[exchangeIndex].data[toToken] &&
            priceData[exchangeIndex].data[toToken][fromToken]) {

            console.log('inverse exists!!!')

            const inversePrice = priceData[exchangeIndex].data[toToken][fromToken]

            console.log(inversePrice)
            console.log(typeof inversePrice)

            const price = 1 / inversePrice;

            console.log('price: ', price)

            console.log(`price exists for ${fromToken} to ${toToken} on ${exchangeToCheck}: ${price}`);
            exchangePricesForSwap.push(price);

            console.log('k2 ' + exchangePricesForSwap)

          } else {
            exchangePricesForSwap.push(Infinity);
          }

          console.log('uhh ' + exchangePricesForSwap)

          if (exchangeIndex === exchanges.length - 1) {

            console.log(`calculating best swap price for ${fromToken} to ${toToken}...`)

            console.log(`${exchangePricesForSwap}`)

            const bestPrice = Math.min(...exchangePricesForSwap);
            resultPrices.push(bestPrice);

            const bestExchange = exchanges[exchangePricesForSwap.indexOf(bestPrice)];

            console.log(exchangePricesForSwap)
            console.log('bestExchange: ', bestExchange)

            resultExchanges.push(bestExchange);
            exchangePricesForSwap = []

          }

        })

      }

    })

    return { exchangeChoices: resultExchanges, exchangePrices: resultPrices };

  }

  calcualteNetProfitOfStrategy(borrowAmount, prices) {

    console.log('calculating net profit for these: ', borrowAmount, prices);

    // const amountAfterTrades = prices.reduce( (accumulator, price) => {



    // }, 0);

    let amountAfterTrades = borrowAmount;

    prices.forEach(price => {
      amountAfterTrades *= price;
    })

    const netProfit = amountAfterTrades - borrowAmount;

    console.log('profit ', netProfit);

    return netProfit;
  }

  render() {

    return (
      <div className="Strategizer-Table-Container">
        <div classNae="Header-Inputs-Section">
          <br />
          <p className="Inputs-Text">ETH,
            Cryptos: {stringifiedTickers}
          </p>

          <br />
          <br />
          <p className="Inputs-Text">
            Exchanges: {stringifiedExchanges}
          </p>
          <br />

          <br />
          <p className="Inputs-Text">
            Flash-Loan Borrowable Currencies: ETH
          </p>

          <br />
          <br />

          <hr />

          <br />
          <br />

          <h2>Pairs</h2>
          <br />

          <p>
            Displays all existing pairs (for given exchanges) and # of exchanges
            supporting the pair.
          </p>
          <p>(Currently just mock data)</p>

          <br />
          <ul>
            <li>- ETH/WETH: 2</li>
            <br />
            <li>- ETH/BTC: 2</li>
            <br />
            <li>- ETH/USDT: 4</li>
            <br />
            <li>- ETH/DAI: 4</li>
            <br />
            <li>- ETH/DIGG: 5</li>
            <br />
            <li>- DAI/DIGG: 1</li>
            <br />
            <li>- BTC/USDT: 5</li>
          </ul>

          <hr />

          <br />
          <br />

          <h2>Brute Force Permutations</h2>
          <br />
          <p>Displays all available paths of pair swapping.</p>
          <p>(Currently just mock data)</p>
          <br />
          <ul>
            <li>- ETH -&gt; WETH -&gt; DAI -&gt; DIGG -&gt; USDT -&gt; ETH</li>
            <br />
            <li>- ETH -&gt; DAI -&gt; WETH -&gt; DIGG -&gt; USDT -&gt; ETH</li>
            <br />
            <li>- ETH -&gt; DAI -&gt; DIGG -&gt; WETH -&gt; USDT -&gt; ETH</li>
            <br />
            <li>- ETH -&gt; WETH -&gt; DIGG -&gt; WETH -&gt; USDT -&gt; ETH</li>
            <br />
          </ul>

          <hr />

          <br />
          <br />

          <h2>Hand Picked Permutations</h2>
          <br />
          <p>Specifically chosen by Jim for trades across _only_ Uniswapv2 and SushiSwap.</p>
          <p>(triangular pairs with WETH available by combining uniswapv2 and sushiswap)</p>
          <br />
          <ul>
            <li>WETH -&gt; WBTC -&gt; DAI -&gt; WETH</li>
            <br />
            <li>WETH -&gt; WBTC -&gt; BADGER -&gt; WETH</li>
            <br />
            <li>WETH -&gt; WBTC -&gt; DIGG -&gt; WETH</li>
            <br />
            <li>WETH -&gt; DAI -&gt; WBTC -&gt; WETH</li>
            <br />
            <li>WETH -&gt; BADGER -&gt; WBTC -&gt; WETH</li>
            <br />
            <li>WETH -&gt; DIGG -&gt; WBTC -&gt; WETH</li>
            <br />
            <li>WETH -&gt; UNI -&gt; LINK -&gt; WETH</li>
            <br />
            <li>WETH -&gt; LINK -&gt; UNI -&gt; WETH</li>
            <br />
          </ul>
          <hr />

          <br />
          <br />

          <h2>Price Data</h2>
          <br />
          <p>Data coming in from CryptoCompare</p>
          <p>Calling for more data in: {this.state.countdownText}</p>
          <br />
          {/* <ul> */}

          {this.state.latestPrices.length && this.state.latestPrices.map((exchangePrices, index) => {

            return <div>
              <h2>{exchanges[index]}</h2>

              <pre className='left-text'>{JSON.stringify(exchangePrices.data, null, 2)}</pre>

            </div>

          })}

          <hr />

          <br />
          <br />

          <h2>Strategies</h2>

          <p>A list of specific strategies.</p>
          <p>
            Each strategy describes the borrow amount and a sequence of swaps to
            execute on the specified exchanges.
          </p>
          <br />
          <br />

          <br />
          <br />
          <br />
          <table class="codexpl">
            <tr>
              <th className="col1">#</th>
              <th className="col2">
                Coin
                <br />
                Sequence
              </th>
              <th className="col3">Exchanges</th>
              <th className="col4">Net Profit</th>
              <th className="col5">Amount to Borrow</th>
              <th className="col5">
                Execute
                <br />
                Trades
              </th>
            </tr>

            {this.state.rankedStrategies.map((rankedStrategy, strageyRanking) => {
              // { this.state.rank }

              return <tr>
                <td>{strageyRanking + 1}</td>

                <td>
                  {rankedStrategy.tokens.map(token => {
                    return <div>
                      {token}
                      < br />↓<br />
                    </div>

                  })}
                </td>
                <td>
                {rankedStrategy.exchangeChoices.map(token => {
                    return <div>
                      {token}
                      < br />↓<br />
                    </div>

                  })}
                </td>
                <td>{rankedStrategy.netProfit.toFixed(2)} Eth</td>
                <td>{borrowAmount} Eth from AAVE</td>
                <td>
                  <button>SEND TRADES</button>
                </td>
              </tr>
            })}
            
          </table>
        </div>

        <br />
        <br />

        {JSON.stringify(this.state.rankedStrategies)}

        <br />
        <br />
        <br />
      </div>
    )
  }
}

export default StrategizerTable
