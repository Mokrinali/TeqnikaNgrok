interface NumPadProps {
  value: string
  onChange: (v: string) => void
  maxLength: number
  placeholder?: string
  className?: string
  dark?: boolean
}

export default function NumPad({ value, onChange, maxLength, placeholder = '_ _ _ _', className = '', dark = false }: NumPadProps) {
  const press = (v: string) => {
    if (v === 'del') { onChange(value.slice(0, -1)); return }
    if (value.length < maxLength) onChange(value + v)
  }

  return (
    <div className={className}>
      {dark ? (
        <input
          readOnly
          value={value}
          placeholder={placeholder}
          className="inp-dark"
          inputMode="none"
        />
      ) : (
        <input
          readOnly
          value={value}
          placeholder={placeholder}
          className="inp inp-xl mb-4"
          inputMode="none"
        />
      )}
      <div className="numpad">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} className={dark ? 'nkey-dark' : 'nkey'} onClick={() => press(d)} type="button">{d}</button>
        ))}
        <div />
        <button className={dark ? 'nkey-dark' : 'nkey'} onClick={() => press('0')} type="button">0</button>
        <button
          className={dark ? 'nkey-dark nkey-del-dark' : 'nkey nkey-del'}
          onClick={() => press('del')}
          type="button"
        >⌫</button>
      </div>
    </div>
  )
}
