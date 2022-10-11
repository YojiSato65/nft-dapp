import React, { useState, useEffect } from 'react'
import { Button, Modal, Form } from 'react-bootstrap'
import { BigNumber, ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { Spinner } from 'react-bootstrap'

export default function HomePage() {
  const [address, setAddress] = useState('')
  const [counter, setCounter] = useState(1)
  const [price, setPrice] = useState(0)
  const [status, setStatus] = useState('')
  const [statuses, setStatuses] = useState('')
  const [tokens, setTokens] = useState([])
  const [tokenIds, setTokenIds] = useState([])
  const [recipient, setRecipient] = useState(
    '0xa3123e1D8A7EA78608776cF8b083E68b58FbF4d3',
  )
  const [isLoading, setIsLoading] = useState(true)
  const [tokenSelected, setTokenSelected] = useState(null)
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => {
    setStatus((status) => '')
    setShow(true)
  }
  const [show2, setShow2] = useState(false)
  const handleClose2 = () => setShow2(false)
  const handleShow2 = () => {
    setStatus((status) => '')
    setShow2(true)
  }

  const abi = [
    'function mint(uint256 _amount) external payable',
    'function bundlePrice(uint256 amount) public view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)',
    'function tokenURI(uint256 tokenId) external view returns (string memory)',
    'function transferFrom(address from, address to, uint256 tokenId) external',
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

      const tokensArr = []
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenIdBn = await contract.tokenOfOwnerByIndex(address, i)
        // console.log('tokenIdBn', tokenIdBn.toNumber())
        const tokenURI = await contract.tokenURI(tokenIdBn)
        // console.log('tokenURI', tokenURI)
        const res = await fetch(tokenURI)
        const data = await res.json()
        // console.log('data', data)
        tokensArr.push(data)
      }
      setTokens(tokensArr)
      setIsLoading((prev) => false)
    } catch (error) {
      console.error(error)
    }
  }

  // recipient: 0xa3123e1D8A7EA78608776cF8b083E68b58FbF4d3
  const transferNFT = async (e) => {
    e.preventDefault()
    try {
      handleShow2()
      console.log('tokenIds', tokenIds)
      setStatuses(tokenIds.map((Id) => 'waiting'))
      const signer = provider.getSigner(address)
      const contract = new ethers.Contract(contractAddress, abi, signer)
      const txs = []

      const eachTx = async (i) => {
        try {
          const tokenIdBn = await contract.tokenOfOwnerByIndex(address, i)
          const tokenId = tokenIdBn.toNumber()
          const tx = await contract.transferFrom(address, recipient, tokenId)
          setStatuses((statuses) =>
            statuses.map((status, index) =>
              index === i ? 'appreved' : status,
            ),
          )
          await tx.wait()
          setStatuses((statuses) =>
            statuses.map((status, index) => (index === i ? 'mined' : status)),
          )
          console.log('tx', tx)
        } catch (error) {
          setStatuses((statuses) =>
            statuses.map((status, index) =>
              index === i ? 'rejected' : status,
            ),
          )
        }
      }
      for (let i = 0; i < tokenIds.length; i++) {
        txs.push(eachTx(i))
      }
      await Promise.all(txs)
    } catch (error) {
      console.error(error)
    }
  }

  const handleTokenId = (index) => {
    console.log('index', index)
    if (!tokenIds.includes(index)) {
      tokenIds.push(index)
      // setTokenSelected((token) => index)
    }
    // else
    // {
    //   tokenIds.filter((el) => el !== index)
    // }

    console.log('added:', tokenIds)
    return tokenIds
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Button
        onClick={handleShow}
        style={{ transform: 'scale(2)', margin: '50px' }}
        variant="dark"
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

      <section style={{ marginTop: '50px', width: '100%' }}>
        <form
          style={{ width: '100%', textAlign: 'right', paddingRight: '100px' }}
          onSubmit={transferNFT}
        >
          <input
            type="text"
            placeholder="enter the address"
            style={{ width: '500px', height: '50px' }}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <Button variant="dark" type="submit">
            send
          </Button>
        </form>
        <Modal show={show2} onHide={handleClose2} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>Transaction</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {tokenIds.map((tokenId, i) => (
              <div
                style={{ display: 'flex', justifyContent: 'space-evenly' }}
                key={i}
              >
                <p>Token ID: {tokenId}</p>
                <p>Status: {statuses[i]}</p>
              </div>
            ))}
          </Modal.Body>
        </Modal>
        <h2 style={{ textAlign: 'center', marginTop: '50px' }}>
          Your NFT Collection
        </h2>
        {isLoading ? (
          <Spinner
            animation="border"
            role="status"
            style={{
              display: 'flex',
              marginRight: 'auto',
              marginLeft: 'auto',
              marginTop: '50px',
            }}
          >
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '50px',
            }}
          >
            {tokens.map((token, index) => (
              <div
                style={{
                  width: '200px',
                  height: '300px',
                  border: '2px solid black',
                  borderRadius: '10px',
                  margin: '10px',
                  paddingTop: 'auto',
                }}
                key={index}
                onClick={() => {
                  handleTokenId(index)
                }}
              >
                <img
                  src={token.image}
                  alt="NFT"
                  style={{ width: '100%', padding: '10px' }}
                />
                <h3 style={{ textAlign: 'center' }}>{token.name}</h3>
                {tokenIds.includes(index) && <p>selected!</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
