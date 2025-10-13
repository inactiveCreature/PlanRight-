import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Switch } from '../components/ui/Switch'

describe('Switch Accessibility', () => {
  it('toggles_with_keyboard - Space and Enter flip checked state', () => {
    const onChange = vi.fn()
    
    render(
      <Switch
        checked={false}
        onChange={onChange}
        ariaLabel="Test switch"
      />
    )
    
    const switchElement = screen.getByRole('switch')
    
    // Test Space key
    fireEvent.keyDown(switchElement, { key: ' ' })
    expect(onChange).toHaveBeenCalledWith(true)
    
    // Test Enter key
    fireEvent.keyDown(switchElement, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('respects_disabled - disabled switch does not toggle via click or keys', () => {
    const onChange = vi.fn()
    
    render(
      <Switch
        checked={false}
        onChange={onChange}
        disabled={true}
        ariaLabel="Disabled switch"
      />
    )
    
    const switchElement = screen.getByRole('switch')
    
    // Test click
    fireEvent.click(switchElement)
    expect(onChange).not.toHaveBeenCalled()
    
    // Test Space key
    fireEvent.keyDown(switchElement, { key: ' ' })
    expect(onChange).not.toHaveBeenCalled()
    
    // Test Enter key
    fireEvent.keyDown(switchElement, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('announces_state - aria-checked updates when toggled', () => {
    const onChange = vi.fn()
    
    const { rerender } = render(
      <Switch
        checked={false}
        onChange={onChange}
        ariaLabel="Test switch"
      />
    )
    
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('aria-checked', 'false')
    
    // Rerender with checked=true
    rerender(
      <Switch
        checked={true}
        onChange={onChange}
        ariaLabel="Test switch"
      />
    )
    
    expect(switchElement).toHaveAttribute('aria-checked', 'true')
  })

  it('has_proper_accessibility_attributes', () => {
    render(
      <Switch
        checked={false}
        onChange={vi.fn()}
        ariaLabel="Test switch"
        id="test-switch"
      />
    )
    
    const switchElement = screen.getByRole('switch')
    
    expect(switchElement).toHaveAttribute('role', 'switch')
    expect(switchElement).toHaveAttribute('aria-checked', 'false')
    expect(switchElement).toHaveAttribute('aria-label', 'Test switch')
    expect(switchElement).toHaveAttribute('id', 'test-switch')
    expect(switchElement).toHaveAttribute('type', 'button')
  })

  it('supports_different_sizes', () => {
    const { rerender } = render(
      <Switch
        checked={false}
        onChange={vi.fn()}
        size="sm"
        ariaLabel="Small switch"
      />
    )
    
    let switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveClass('w-9', 'h-5')
    
    rerender(
      <Switch
        checked={false}
        onChange={vi.fn()}
        size="md"
        ariaLabel="Medium switch"
      />
    )
    
    switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveClass('w-11', 'h-6')
    
    rerender(
      <Switch
        checked={false}
        onChange={vi.fn()}
        size="lg"
        ariaLabel="Large switch"
      />
    )
    
    switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveClass('w-14', 'h-7')
  })

  it('applies_custom_className', () => {
    render(
      <Switch
        checked={false}
        onChange={vi.fn()}
        className="custom-class"
        ariaLabel="Test switch"
      />
    )
    
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveClass('custom-class')
  })
})
