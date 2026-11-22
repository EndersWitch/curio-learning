// Server-only. Accounting and financial-literacy questions where CODE does every
// calculation. The learner reads a small table of information and types the
// amounts. Grade 7 to 10 level, South African CAPS terms only (no residual value).

import { mk, pick, rnd, type GeometryQuestion } from '@/lib/testbuilder/geometry'

const INK = '#222', RUST = '#b2431f', HEAD = '#e9e4d8'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
export const rand = (n: number) => `R${(Math.round(n * 100) / 100).toLocaleString('en-ZA').replace(/ | /g, ' ').replace(',', ',')}`
const money = (n: number) => {
  const neg = n < 0, v = Math.abs(Math.round(n * 100) / 100)
  const [i, d] = v.toFixed(2).split('.')
  const body = i!.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${neg ? '−' : ''}R${body}${d === '00' ? '' : ',' + d}`
}

// A plain table: first row is the header.
function table(title: string | null, rows: string[][], widths: number[]): string {
  const rowH = 28, pad = 8, total = widths.reduce((a, b) => a + b, 0)
  const top = title ? 30 : 6
  const H = top + rows.length * rowH + pad
  let x0 = 10
  const out: string[] = []
  if (title) out.push(`<text x="${10 + total / 2}" y="20" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700" fill="${RUST}">${esc(title)}</text>`)
  rows.forEach((r, ri) => {
    let x = x0
    const y = top + ri * rowH
    r.forEach((cell, ci) => {
      const w = widths[ci]!
      out.push(`<rect x="${x}" y="${y}" width="${w}" height="${rowH}" fill="${ri === 0 ? HEAD : '#fff'}" stroke="${INK}" stroke-width="1.2"/>`)
      const num = ci > 0 && /^[R−]?\d/.test(cell)
      out.push(`<text x="${num ? x + w - 8 : x + 8}" y="${y + 18}" text-anchor="${num ? 'end' : 'start'}" font-family="Arial,Helvetica,sans-serif" font-size="12.5" font-weight="${ri === 0 ? 700 : 400}" fill="${INK}">${esc(cell)}</text>`)
      x += w
    })
  })
  const W = total + 20
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${out.join('')}</svg>`
}

function done(g: GeometryQuestion): GeometryQuestion {
  g.spec.plain = true
  g.key.tol = 0.005
  return g
}
const F = (id: string, label: string) => ({ id, label })

export interface AccInfo { id: string; use: string }
export const ACCOUNTING: AccInfo[] = [
  { id: 'accDepSL', use: 'Grades 8-10 accounting/EMS: straight-line depreciation at a stated % of cost, and carrying value.' },
  { id: 'accDepDB', use: 'Grades 9-10 accounting/EMS: diminishing balance depreciation at a stated % for two years.' },
  { id: 'accVat', use: 'Grades 9-12 accounting/EMS/maths literacy: VAT at 15% on a price (add VAT or remove VAT).' },
  { id: 'accMarkup', use: 'Grades 8-10 accounting/EMS: selling price and profit from cost price and mark-up %.' },
  { id: 'accCrj', use: 'Grades 8-10 accounting/EMS: add up the Bank and Debtors Control columns of a small Cash Receipts Journal.' },
  { id: 'accCpj', use: 'Grades 8-10 accounting/EMS: add up the Bank and Creditors Control columns of a small Cash Payments Journal.' },
  { id: 'accEquation', use: 'Grades 7-10 accounting/EMS: find the missing figure in Assets = Owner\'s equity + Liabilities.' },
  { id: 'accCreditor', use: 'Grades 8-10 accounting/EMS: closing balance of a creditor\'s account from opening balance, purchases, payments and returns.' },
  { id: 'accGross', use: 'Grades 9-12 accounting/EMS: gross profit and gross profit % on sales from sales and cost of sales.' },
  { id: 'accBudget', use: 'Grades 7-9 EMS: total income, total expenses and surplus or deficit from a simple monthly budget.' },
]
export const ACCOUNTING_IDS = ACCOUNTING.map(a => a.id)

const ASSETS = ['Vehicle', 'Equipment', 'Computer', 'Furniture', 'Machinery']

const MAKERS: Record<string, () => GeometryQuestion> = {
  accDepSL() {
    const asset = pick(ASSETS), cost = rnd(20, 90) * 1000, rate = pick([10, 15, 20, 25]), yrs = rnd(2, 3)
    const dep = cost * rate / 100, cv = cost - dep * yrs
    const svg = table('Information', [['Item', 'Detail'], ['Asset', asset], ['Cost price', money(cost)], ['Rate (straight-line)', `${rate}% per year of cost`], ['Years owned', String(yrs)]], [220, 130])
    return done(mk(
      `A business owns ${asset === 'Machinery' ? 'machinery' : 'a ' + asset.toLowerCase()} and depreciates ${asset === 'Machinery' ? 'it' : 'it'} by the straight-line method. Work out the depreciation for one year and the carrying value after ${yrs} years.`,
      svg, [F('dep', 'Depreciation for one year (R)'), F('cv', `Carrying value after ${yrs} years (R)`)], { dep, cv }, [],
      `Depreciation = ${rate}% × ${money(cost)} = ${money(dep)} each year. Accumulated depreciation after ${yrs} years = ${money(dep)} × ${yrs} = ${money(dep * yrs)}. Carrying value = ${money(cost)} − ${money(dep * yrs)} = ${money(cv)}.`))
  },
  accDepDB() {
    const asset = pick(ASSETS), cost = rnd(10, 60) * 1000, rate = pick([10, 20, 25])
    const d1 = cost * rate / 100, cv1 = cost - d1, d2 = cv1 * rate / 100, cv2 = cv1 - d2
    const svg = table('Information', [['Item', 'Detail'], ['Asset', asset], ['Cost price', money(cost)], ['Rate (diminishing balance)', `${rate}% per year`]], [220, 130])
    return done(mk(
      `A business owns ${asset === 'Machinery' ? 'machinery' : 'a ' + asset.toLowerCase()} and depreciates it by the diminishing balance method. Work out the depreciation for the second year and the carrying value at the end of the second year.`,
      svg, [F('d2', 'Depreciation for year 2 (R)'), F('cv2', 'Carrying value at end of year 2 (R)')], { d2, cv2 }, [],
      `Year 1: ${rate}% × ${money(cost)} = ${money(d1)}, carrying value ${money(cv1)}. Year 2: ${rate}% × ${money(cv1)} = ${money(d2)}. Carrying value at end of year 2 = ${money(cv1)} − ${money(d2)} = ${money(cv2)}.`))
  },
  accVat() {
    const incl = Math.random() < 0.5
    const excl = rnd(4, 60) * 100
    const vat = excl * 0.15, inc = excl + vat
    if (incl) {
      const svg = table('Invoice', [['Item', 'Amount'], ['Total including VAT', money(inc)], ['VAT rate', '15%']], [220, 130])
      return done(mk('The invoice shows a total that includes VAT at 15%. Work out the price before VAT and the VAT amount.', svg, [F('ex', 'Price excluding VAT (R)'), F('vat', 'VAT amount (R)')], { ex: excl, vat }, [],
        `Price excluding VAT = ${money(inc)} × 100 ÷ 115 = ${money(excl)}. VAT = ${money(inc)} − ${money(excl)} = ${money(vat)}.`))
    }
    const svg = table('Invoice', [['Item', 'Amount'], ['Price excluding VAT', money(excl)], ['VAT rate', '15%']], [220, 130])
    return done(mk('Work out the VAT and the total price including VAT.', svg, [F('vat', 'VAT amount (R)'), F('inc', 'Price including VAT (R)')], { vat, inc }, [],
      `VAT = 15% × ${money(excl)} = ${money(vat)}. Price including VAT = ${money(excl)} + ${money(vat)} = ${money(inc)}.`))
  },
  accMarkup() {
    const cost = rnd(2, 40) * 50, mu = pick([20, 25, 40, 50, 60, 80, 100])
    const profit = cost * mu / 100, sell = cost + profit
    const svg = table('Information', [['Item', 'Detail'], ['Cost price', money(cost)], ['Mark-up', `${mu}% on cost price`]], [220, 130])
    return done(mk('A shop adds a mark-up on cost price. Work out the profit on one item and the selling price.', svg, [F('p', 'Profit on one item (R)'), F('s', 'Selling price (R)')], { p: profit, s: sell }, [],
      `Profit = ${mu}% × ${money(cost)} = ${money(profit)}. Selling price = cost + profit = ${money(cost)} + ${money(profit)} = ${money(sell)}.`))
  },
  accCrj() {
    const cs = rnd(5, 30) * 100, dp = rnd(3, 20) * 100, rent = rnd(2, 10) * 100
    const rows = [['Day', 'Details', 'Bank', 'Debtors Control'], ['3', 'Cash sales', money(cs), '–'], ['9', 'Received from debtor', money(dp), money(dp)], ['15', 'Rent income', money(rent), '–']]
    const svg = table('Cash Receipts Journal', rows, [40, 140, 80, 130])
    return done(mk('Add up the Bank column and the Debtors Control column of the Cash Receipts Journal.', svg, [F('b', 'Bank total (R)'), F('d', 'Debtors Control total (R)')], { b: cs + dp + rent, d: dp }, [],
      `Bank = ${money(cs)} + ${money(dp)} + ${money(rent)} = ${money(cs + dp + rent)}. Debtors Control = ${money(dp)} (only one entry).`))
  },
  accCpj() {
    const exp = rnd(2, 15) * 100, cr = rnd(5, 30) * 100, cr2 = rnd(3, 15) * 100
    const rows = [['Day', 'Details', 'Bank', 'Creditors Control'], ['2', 'Rent paid', money(exp), '–'], ['11', 'Paid creditor A', money(cr), money(cr)], ['20', 'Paid creditor B', money(cr2), money(cr2)]]
    const svg = table('Cash Payments Journal', rows, [40, 140, 80, 140])
    return done(mk('Add up the Bank column and the Creditors Control column of the Cash Payments Journal.', svg, [F('b', 'Bank total (R)'), F('c', 'Creditors Control total (R)')], { b: exp + cr + cr2, c: cr + cr2 }, [],
      `Bank = ${money(exp)} + ${money(cr)} + ${money(cr2)} = ${money(exp + cr + cr2)}. Creditors Control = ${money(cr)} + ${money(cr2)} = ${money(cr + cr2)}.`))
  },
  accEquation() {
    const eq = rnd(20, 90) * 1000, li = rnd(5, 40) * 1000, as = eq + li
    const missing = pick(['assets', 'equity', 'liabilities'] as const)
    const cells = { assets: money(as), equity: money(eq), liabilities: money(li) }
    const shown = (k: 'assets' | 'equity' | 'liabilities') => (k === missing ? '?' : cells[k])
    const svg = table('Accounting equation', [['Assets', "Owner's equity", 'Liabilities'], [shown('assets'), shown('equity'), shown('liabilities')]], [117, 117, 117])
    const name = { assets: 'Assets', equity: "Owner's equity", liabilities: 'Liabilities' }[missing]
    const val = { assets: as, equity: eq, liabilities: li }[missing]
    const how = { assets: `Assets = Owner's equity + Liabilities = ${money(eq)} + ${money(li)} = ${money(as)}.`, equity: `Owner's equity = Assets − Liabilities = ${money(as)} − ${money(li)} = ${money(eq)}.`, liabilities: `Liabilities = Assets − Owner's equity = ${money(as)} − ${money(eq)} = ${money(li)}.` }[missing]
    return done(mk(`Use the accounting equation (Assets = Owner's equity + Liabilities) to find the missing figure.`, svg, [F('v', `${name} (R)`)], { v: val }, [], how))
  },
  accCreditor() {
    const open = rnd(5, 30) * 100, buy = rnd(5, 30) * 100, pay = rnd(2, 20) * 100, ret = rnd(1, 5) * 100
    const close = open + buy - pay - ret
    if (close <= 0) return MAKERS.accCreditor!()
    const svg = table("Creditor's account", [['Detail', 'Amount'], ['Opening balance (owed to creditor)', money(open)], ['Credit purchases', money(buy)], ['Payments made', money(pay)], ['Goods returned', money(ret)]], [240, 110])
    return done(mk('Work out how much the business still owes this creditor at the end of the month.', svg, [F('c', 'Closing balance owed (R)')], { c: close }, [],
      `Owed = opening balance + purchases − payments − returns = ${money(open)} + ${money(buy)} − ${money(pay)} − ${money(ret)} = ${money(close)}.`))
  },
  accGross() {
    const sales = rnd(10, 80) * 1000, pct = pick([20, 25, 30, 40, 50]), gp = sales * pct / 100, cos = sales - gp
    const svg = table('Information', [['Item', 'Amount'], ['Sales', money(sales)], ['Cost of sales', money(cos)]], [220, 130])
    return done(mk('Work out the gross profit and the gross profit percentage on sales.', svg, [F('gp', 'Gross profit (R)'), F('pct', 'Gross profit % on sales')], { gp, pct }, [],
      `Gross profit = sales − cost of sales = ${money(sales)} − ${money(cos)} = ${money(gp)}. Gross profit % on sales = ${money(gp)} ÷ ${money(sales)} × 100 = ${pct}%.`))
  },
  accBudget() {
    const sal = rnd(40, 120) * 100, side = rnd(0, 6) * 100
    const rent = rnd(10, 30) * 100, food = rnd(8, 20) * 100, tr = rnd(3, 8) * 100, other = rnd(1, 6) * 100
    const inc = sal + side, exp = rent + food + tr + other, bal = inc - exp
    const rows = [['Item', 'Amount'], ['Salary', money(sal)], ['Side income', side ? money(side) : 'R0'], ['Rent', money(rent)], ['Food', money(food)], ['Transport', money(tr)], ['Other', money(other)]]
    const svg = table('Monthly budget', rows, [220, 130])
    return done(mk('Work out the total income, the total expenses and the surplus (income minus expenses). A deficit is shown with a minus sign.', svg, [F('i', 'Total income (R)'), F('e', 'Total expenses (R)'), F('s', 'Surplus or deficit (R)')], { i: inc, e: exp, s: bal }, [],
      `Income = ${money(sal)} + ${money(side)} = ${money(inc)}. Expenses = ${money(rent)} + ${money(food)} + ${money(tr)} + ${money(other)} = ${money(exp)}. Surplus = ${money(inc)} − ${money(exp)} = ${money(bal)}.`))
  },
}

export function makeAccounting(id: string): GeometryQuestion | null {
  const fn = MAKERS[id]
  if (!fn) return null
  try { return fn() } catch (err) { console.error('[tests] accounting failed', id, err); return null }
}
