import React from 'react'

type LabelledTextboxProps = React.InputHTMLAttributes<HTMLInputElement> & {label: string}

export default function LabelledTextBox (props: LabelledTextboxProps) {
  const rawTextboxProps: any = {}
  Object.assign(rawTextboxProps, props)
  delete rawTextboxProps.label
  const textboxProps = rawTextboxProps as React.InputHTMLAttributes<HTMLInputElement>
  if (!textboxProps.className) {
    textboxProps.className += ' '
  } else {
    textboxProps.className = ''
  }
  textboxProps.className += 'LabelledTextboxTextbox'
  return (
    <div className='LabelledTextbox'>
      <label>{props.label}</label>
      <input {...textboxProps}/>
    </div>
  )
}
