import assert from 'node:assert/strict'
import test from 'node:test'

import { csvField, neutralizeFormula } from '../supabase/functions/_shared/csv.js'

test('formül tetikleyicileri ile başlayan metin etkisizleştirilir', () => {
  for (const trigger of ['=', '+', '-', '@', '\t', '\r']) {
    assert.equal(neutralizeFormula(`${trigger}cmd|' /C calc'!A0`).startsWith("'"), true, trigger)
  }
})

test('normal metin değişmez', () => {
  assert.equal(neutralizeFormula('Netflix'), 'Netflix')
  assert.equal(neutralizeFormula(''), '')
  assert.equal(neutralizeFormula(null), '')
  assert.equal(neutralizeFormula('a=b'), 'a=b')
})

test('csvField tırnakları kaçırır ve formülü etkisizleştirir', () => {
  assert.equal(csvField('=HYPERLINK("http://x","tıkla")'), `"'=HYPERLINK(""http://x"",""tıkla"")"`)
  assert.equal(csvField('Ad, "soyad"'), '"Ad, ""soyad"""')
})

test('sayısal sütunlar (text: false) korunur', () => {
  assert.equal(csvField('-5.00', { text: false }), '"-5.00"')
  assert.equal(csvField('2026-10-01', { text: false }), '"2026-10-01"')
  assert.equal(csvField('-5.00'), `"'-5.00"`)
})

test('null ve undefined boş alan olur', () => {
  assert.equal(csvField(null), '""')
  assert.equal(csvField(undefined), '""')
})
