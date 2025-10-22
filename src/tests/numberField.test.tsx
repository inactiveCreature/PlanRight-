import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NumberField } from '../components/NumberField'

describe('NumberField', () => {
  it('numberfield_allows_decimals - enter 12.5, blur → value 12.5', async () => {
    const onCommit = vi.fn()

    render(
      <NumberField
        label="Test Field"
        value={undefined}
        onCommit={onCommit}
        placeholder="Enter value"
      />
    )

    const input = screen.getByRole('textbox')

    // Type "12.5"
    fireEvent.change(input, { target: { value: '12.5' } })
    expect(input).toHaveValue('12.5')

    // Blur to commit
    fireEvent.blur(input)

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith(12.5)
    })
  })

  it('numberfield_empty_is_allowed_during_edit - "" while typing, commit restores prior or undefined', async () => {
    const onCommit = vi.fn()

    render(
      <NumberField label="Test Field" value={10} onCommit={onCommit} placeholder="Enter value" />
    )

    const input = screen.getByRole('textbox')

    // Clear the input
    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue('')

    // Blur to commit
    fireEvent.blur(input)

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith(undefined)
    })
  })

  it('setback_decimal_persists - type 0.9 → Review shows 0.9', async () => {
    const onCommit = vi.fn()

    render(
      <NumberField
        label="Setback"
        value={undefined}
        onCommit={onCommit}
        placeholder="0.9"
        suffix="m"
      />
    )

    const input = screen.getByRole('textbox')

    // Type "0.9"
    fireEvent.change(input, { target: { value: '0.9' } })
    expect(input).toHaveValue('0.9')

    // Blur to commit
    fireEvent.blur(input)

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith(0.9)
    })
  })

  it('should handle Enter key to commit value', async () => {
    const onCommit = vi.fn()

    render(
      <NumberField
        label="Test Field"
        value={undefined}
        onCommit={onCommit}
        placeholder="Enter value"
      />
    )

    const input = screen.getByRole('textbox')

    // Type "5.5"
    fireEvent.change(input, { target: { value: '5.5' } })

    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith(5.5)
    })
  })

  it('should clamp values to min/max range', async () => {
    const onCommit = vi.fn()

    render(
      <NumberField
        label="Test Field"
        value={undefined}
        onCommit={onCommit}
        min={0}
        max={10}
        placeholder="Enter value"
      />
    )

    const input = screen.getByRole('textbox')

    // Type value below min
    fireEvent.change(input, { target: { value: '-5' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith(0) // Should be clamped to min
    })

    // Type value above max
    fireEvent.change(input, { target: { value: '15' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith(10) // Should be clamped to max
    })
  })

  it('should show error when value is out of range', () => {
    render(
      <NumberField
        label="Test Field"
        value={15}
        onCommit={vi.fn()}
        min={0}
        max={10}
        placeholder="Enter value"
      />
    )

    // Should show error message
    expect(screen.getByText('Value must be at most 10')).toBeInTheDocument()
  })

  it('should allow partial decimal input during typing', () => {
    const onCommit = vi.fn()

    render(
      <NumberField
        label="Test Field"
        value={undefined}
        onCommit={onCommit}
        placeholder="Enter value"
      />
    )

    const input = screen.getByRole('textbox')

    // Type just "."
    fireEvent.change(input, { target: { value: '.' } })
    expect(input).toHaveValue('.')

    // Type "0."
    fireEvent.change(input, { target: { value: '0.' } })
    expect(input).toHaveValue('0.')

    // Type "-"
    fireEvent.change(input, { target: { value: '-' } })
    expect(input).toHaveValue('-')
  })

  it('should reject invalid characters', () => {
    const onCommit = vi.fn()

    render(
      <NumberField
        label="Test Field"
        value={undefined}
        onCommit={onCommit}
        placeholder="Enter value"
      />
    )

    const input = screen.getByRole('textbox')

    // Try to type invalid characters
    fireEvent.change(input, { target: { value: 'abc123' } })
    expect(input).toHaveValue('123') // Only numbers should remain

    fireEvent.change(input, { target: { value: '12.34.56' } })
    expect(input).toHaveValue('12.34') // Only valid decimal should remain
  })

  it('should handle disabled state', () => {
    render(
      <NumberField
        label="Test Field"
        value={5}
        onCommit={vi.fn()}
        disabled={true}
        placeholder="Enter value"
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should show required asterisk when required', () => {
    render(
      <NumberField
        label="Required Field"
        value={undefined}
        onCommit={vi.fn()}
        required={true}
        placeholder="Enter value"
      />
    )

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should display suffix correctly', () => {
    render(
      <NumberField
        label="Test Field"
        value={5}
        onCommit={vi.fn()}
        suffix="m²"
        placeholder="Enter value"
      />
    )

    expect(screen.getByText('m²')).toBeInTheDocument()
  })
})
