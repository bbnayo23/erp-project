/**
 * 테스트 전역 설정.
 *
 * jest-dom 매처(toBeInTheDocument 등)를 등록한다. DOM 이 없는 도메인 테스트에도
 * 같이 적용되지만 매처를 더하는 것뿐이라 영향이 없다.
 */
import '@testing-library/jest-dom/vitest'
