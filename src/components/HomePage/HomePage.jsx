import React, { useState, useEffect } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'

export default function HomePage() {
  const [counter, setCounter] = useState(1)
  const [price, setPrice] = useState(0)
  const [status, setStatus] = useState('')
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  const abi = [
    'function mint(uint256 _amount) external payable',
    'function bundlePrice(uint256 amount) public view returns (uint256)',
  ]
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contractAddress = '0xC1F4Fa72e472646b5b05BA615862E7D4B2f7024b'

  useEffect(() => {
    getBundlePrice(counter)
  }, [counter])

  const getBundlePrice = async (counter) => {
    const contract = new ethers.Contract(contractAddress, abi, provider)
    const bundlePrice = await contract.bundlePrice(counter)
    setPrice(formatUnits(bundlePrice))
    console.log('bp', bundlePrice)
    console.log('bp to bigInt', bundlePrice.toBigInt())
    console.log('bp to eth', formatUnits(bundlePrice))
    console.log('bp to eth', ethers.utils.formatEther(bundlePrice))
  }

  const handleSubmit = async () => {
    setStatus((status) => 'Waiting for confirmation')
    if (window.ethereum) {
      try {
        const result = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        const signer = provider.getSigner(result[0])
        const contract = new ethers.Contract(contractAddress, abi, signer)
        const tx = await contract.mint(counter)
        setStatus((status) => 'Sent!')
        await tx.wait()
        setStatus((status) => 'Mined!')
        setTimeout(handleClose, 1000)
      } catch (error) {
        console.log(error)
        setStatus((status) => 'Rejected!')
        setTimeout(handleClose, 1000)
      }
    } else {
      alert('install metamask')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Button onClick={handleShow} style={{ transform: 'scale(3)' }}>
        Mint
      </Button>
      <Modal show={show} onHide={handleClose} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>How many NFTs will you mint?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="secondary"
              onClick={() => {
                setCounter((counter) => {
                  if (counter < 2) return counter
                  else return --counter
                })
                getBundlePrice(counter)
              }}
            >
              -
            </Button>
            <h4 style={{ paddingRight: '50px', paddingLeft: '50px' }}>
              {' '}
              {counter}{' '}
            </h4>
            <Button
              variant="secondary"
              onClick={() => {
                setCounter((counter) => ++counter)
                getBundlePrice(counter)
              }}
            >
              +
            </Button>
          </div>
          <h4 style={{ textAlign: 'center', paddingTop: '20px' }}>
            Price: {price} ETH
          </h4>
        </Modal.Body>
        <Modal.Footer style={{ justifyContent: 'center' }}>
          <Button variant="warning" onClick={handleSubmit}>
            Mint
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
