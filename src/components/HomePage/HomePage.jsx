import React, { useState, useEffect } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { BigNumber, ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'

export default function HomePage() {
  const [address, setAddress] = useState('')
  const [counter, setCounter] = useState(1)
  const [price, setPrice] = useState(0)
  const [status, setStatus] = useState('')
  const [tokens, setTokens] = useState([])
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => {
    setStatus((status) => '')
    setShow(true)
  }

  const abi = [
    'function mint(uint256 _amount) external payable',
    'function bundlePrice(uint256 amount) public view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)',
    'function tokenURI(uint256 tokenId) external view returns (string memory)',
  ]
  const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
  const contractAddress = '0x16eD5F6F3154e25f21b854956F80e114DF504d70'

  useEffect(() => {
    connectWallet()
  }, [])

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        })
        // console.log(chainId)
        if (chainId !== '0x5') {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x5' }],
          })
        }
        const result = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        setAddress(result[0])
      } else {
        alert('install metamask')
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getBundlePrice(counter)
  }, [counter])

  const getBundlePrice = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, abi, provider)
      const bundlePrice = await contract.bundlePrice(counter)
      setPrice(bundlePrice)
      // console.log('bp', bundlePrice)
      // console.log('bp to bigInt', bundlePrice.toBigInt())
      // console.log('bp to eth', formatUnits(bundlePrice))
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async () => {
    setStatus((status) => 'Waiting for confirmation')
    try {
      const signer = provider.getSigner(address)
      const contract = new ethers.Contract(contractAddress, abi, signer)
      const tx = await contract.mint(counter, { value: price })
      setStatus((status) => 'Sent!')
      await tx.wait()
      displayNFT()
      setStatus((status) => 'Mined!')
      setTimeout(handleClose, 1000)
    } catch (error) {
      console.error(error)
      if (error.code === 'ACTION_REJECTED') {
        setStatus((status) => 'Rejected!')
        setTimeout(handleClose, 1000)
      }
    }
  }

  useEffect(() => {
    if (address) {
      displayNFT(address)
    }
  }, [address])

  const displayNFT = async (address) => {
    try {
      const contract = new ethers.Contract(contractAddress, abi, provider)
      const balance = await contract.balanceOf(address)
      // console.log('balance', balance)
      // console.log('balance to num', balance.toNumber())

      let tokensArr = []
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenIndex = await contract.tokenOfOwnerByIndex(address, i)
        // console.log('tokenIndex', tokenIndex.toNumber())
        const tokenURI = await contract.tokenURI(tokenIndex)
        // console.log('tokenURI', tokenURI)
        const res = await fetch(tokenURI)
        const data = await res.json()
        // console.log('data', data)
        tokensArr.push(data)
      }
      setTokens(tokensArr)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        // height: '100vh',
      }}
    >
      <Button
        onClick={handleShow}
        style={{ transform: 'scale(2)', margin: '50px' }}
      >
        Mint
      </Button>
      <Modal show={show} onHide={handleClose} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>How many NFTs will you mint?</Modal.Title>
        </Modal.Header>
        {status === '' ? (
          <>
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
                Price: {formatUnits(price)} ETH
              </h4>
            </Modal.Body>
            <Modal.Footer style={{ justifyContent: 'center' }}>
              <Button variant="warning" onClick={handleSubmit}>
                Mint
              </Button>
            </Modal.Footer>
          </>
        ) : (
          <>
            <Modal.Body>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {status}
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>

      <section style={{ marginTop: '50px' }}>
        <h2 style={{ textAlign: 'center' }}>Your NFT Collection</h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {tokens.map((token, index) => (
            <div
              style={{
                width: '200px',
                height: '300px',
                border: '3px solid black',
                borderRadius: '10px',
                margin: '10px',
              }}
              key={index}
            >
              <img
                src={token.image}
                alt=""
                style={{ width: '100%', padding: '10px' }}
              />
              <h3 style={{ textAlign: 'center' }}>{token.name}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
