export const usePassword = () => {
  const setPassword = (pw: string) => localStorage.setItem('password', pw)
  const getPassword = () => localStorage?.getItem('password') || ''

  return { setPassword, getPassword }
}
