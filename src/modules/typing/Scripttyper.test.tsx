import { render, screen, fireEvent } from '@testing-library/react'
import { Scripttyper } from './Scripttyper'
import { useGame } from '../../state/store'

function seedText() {
  useGame.setState(s => ({
    texts: [{ id: 't', title: 'Test', genre: 'sci-fi', body: 'A' }],
  }))
}

test('start and type correct character increments correct count', async () => {
  seedText()
  render(<Scripttyper />)
  fireEvent.click(screen.getByText('Start'))
  // type 'A'
  const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement | null
  // fallback: directly call store action if input not accessible
  if (!input) {
    useGame.getState().typeChar('A')
  } else {
    fireEvent.change(input, { target: { value: 'A' } })
  }
  expect(screen.getByText(/Correct/i).nextSibling?.textContent).toBe('1')
})
