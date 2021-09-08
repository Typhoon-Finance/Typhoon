import './StrategizerTable.css'

function StrategizerTable() {
  return (
    <div className="Strategizer-Table-Container">
      <div classNae="Header-Inputs-Section">
        <br />
        <p className="Inputs-Text">
          Cryptos: ETH, WETH, BTC, WBTC, DIGG, BADGER, DAI, SAI, USDT, USDC, USD
        </p>

        <br />
        <br />
        <p className="Inputs-Text">
          Exchanges: Uniswapv2, Uniswapv3, SushiSwap, IDEX, Kucoin,
        </p>
        <br />
        <br />
        <p className="Inputs-Text">
          Flash-Loan Borrowable Currencies: ETH, DAI
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

        <h2>Permutations</h2>
        <br />
        <p>Displays all available paths of pair swapping.</p>
        <br />
        <ul>
          <li>- ETH -> WETH -> DAI -> DIGG -> USDT -> ETH</li>
          <br />
          <li>- ETH -> DAI -> WETH -> DIGG -> USDT -> ETH</li>
          <br />
          <li>- ETH -> DAI -> DIGG -> WETH -> USDT -> ETH</li>
          <br />
          <li>- ETH -> WETH -> DIGG -> WETH -> USDT -> ETH</li>
          <br />
        </ul>

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
          <tr>
            <td>1</td>
            <td>
              DAI
              <br />↓<br />
              WETH
              <br />↓<br />
              BTC
              <br />↓<br />
              DIGG
              <br />↓<br />
              DAI
            </td>
            <td>
              AAVE
              <br />↓<br />
              SushiSwap
              <br />↓<br />
              Uniswapv3
              <br />↓<br />
              IDEX
              <br />↓<br />
              AAVE
            </td>
            <td>$1256.23</td>
            <td>10 Eth from AAVE</td>
            <td>
              <button>SEND TRADES</button>
            </td>
          </tr>
          <tr>
            <td>2</td>
            <td>Coloumn</td>
            <td>two</td>
            <td>this</td>
          </tr>
          {/* <tr>
            <td>3</td>
            <td>is</td>
            <td>not equals</td>
            <td>a</td>
          </tr>
          <tr>
            <td>4</td>
            <td>the</td>
            <td>Column</td>
            <td>real</td>
          </tr>
          <tr>
            <td>5</td>
            <td>first</td>
            <td>One</td>
            <td>Coloumn</td>
          </tr> */}
        </table>
      </div>

      <br />
      <br />
      <br />
    </div>
  )
}

export default StrategizerTable
