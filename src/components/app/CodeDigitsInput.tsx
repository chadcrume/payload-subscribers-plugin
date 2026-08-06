'use client'

import { type ChangeEvent, type ClipboardEvent, type KeyboardEvent, useRef } from 'react'

import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

/**
 * Props for the CodeDigitsInput component.
 *
 * @property classNames - Optional CSS class overrides for the digit boxes and their container
 * @property length - Number of digit boxes to render. Defaults to 6, matching the plugin's
 * default login code length
 * @property onChange - Called with the combined code string whenever a digit changes
 * @property value - The current combined code string (controlled)
 */
export interface ICodeDigitsInput {
  classNames?: CodeDigitsInputClasses
  length?: number
  onChange: (code: string) => void
  value: string
}

/**
 * Optional CSS class overrides for CodeDigitsInput elements.
 *
 * @property digit - Class for each individual digit box
 * @property digitsContainer - Class for the row containing the digit boxes
 */
export type CodeDigitsInputClasses = {
  digit?: string
  digitsContainer?: string
}

const onlyDigits = (value: string) => value.replace(/\D/g, '')

/**
 * Renders a login code as one input box per digit, the common OTP pattern, while staying a single
 * controlled value. Typing a digit auto-advances to the next box; Backspace on an empty box moves
 * back to the previous one. Pasting anywhere fills every box from the pasted text in one action,
 * so a copied code can still be pasted in as a whole rather than digit by digit.
 *
 * @param props - Component props (see ICodeDigitsInput)
 * @param props.classNames - Optional class overrides for the digit boxes and their container
 * @param props.length - Number of digit boxes to render. Defaults to 6
 * @param props.onChange - Called with the combined code string whenever a digit changes
 * @param props.value - The current combined code string (controlled)
 * @returns A row of single-digit input boxes representing the code
 */
export const CodeDigitsInput = ({
  classNames = {},
  length = 6,
  onChange,
  value,
}: ICodeDigitsInput) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, index) => value[index] || '')

  const setDigitAt = (index: number, digit: string) => {
    const nextDigits = digits.slice()
    nextDigits[index] = digit
    onChange(nextDigits.join(''))
  }

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const digit = onlyDigits(e.target.value).slice(-1)
    setDigitAt(index, digit)
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      setDigitAt(index - 1, '')
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = onlyDigits(e.clipboardData.getData('text')).slice(0, length)
    if (!pasted) {
      return
    }
    e.preventDefault()
    onChange(pasted)
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div
      className={mergeClassNames([
        'subscribers-codeDigits',
        styles.codeDigits,
        classNames.digitsContainer,
      ])}
    >
      {digits.map((digit, index) => (
        <input
          aria-label={`code digit ${index + 1}`}
          className={mergeClassNames(['subscribers-codeDigit', styles.codeDigit, classNames.digit])}
          inputMode="numeric"
          key={index}
          maxLength={1}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          pattern="[0-9]*"
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          value={digit}
        />
      ))}
    </div>
  )
}
