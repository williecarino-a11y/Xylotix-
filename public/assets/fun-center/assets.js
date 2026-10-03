/*
 * MIIMIID FUN CENTER — ASSET REGISTRY
 *
 * Single source of truth for Fun Center frontend assets.
 * Keep asset paths here instead of hardcoding them throughout
 * the frontend.
 *
 * Same global name and same shape as before, so existing code
 * keeps working.
 */

const MIIMIID_ASSET_BASE = '/assets/fun-center';

function miimiidDeepFreeze(obj) {
  Object.values(obj).forEach((value) => {
    if (value && typeof value === 'object') miimiidDeepFreeze(value);
  });
  return Object.freeze(obj);
}

const MIIMIID_ASSETS = miimiidDeepFreeze({
  characters: {
    miimiid: {
      confused: `${MIIMIID_ASSET_BASE}/characters/miimiid/confused.png`,
      happy: `${MIIMIID_ASSET_BASE}/characters/miimiid/happy.png`,
      running: `${MIIMIID_ASSET_BASE}/characters/miimiid/running.png`,
      sad: `${MIIMIID_ASSET_BASE}/characters/miimiid/sad.png`,
      sleeping: `${MIIMIID_ASSET_BASE}/characters/miimiid/sleeping.png`,
      thinkingQuestion: `${MIIMIID_ASSET_BASE}/characters/miimiid/thinking-question.png`,
      thumbsUp: `${MIIMIID_ASSET_BASE}/characters/miimiid/thumbs-up.png`,
      waving: `${MIIMIID_ASSET_BASE}/characters/miimiid/waving.png`,
      concerned: `${MIIMIID_ASSET_BASE}/characters/miimiid/concerned.png`,
      surprised: `${MIIMIID_ASSET_BASE}/characters/miimiid/surprised.png`,
      encouraging: `${MIIMIID_ASSET_BASE}/characters/miimiid/encouraging.png`
    },
    },

   miimiidCart: {
      idle: `${MIIMIID_ASSET_BASE}/miimiid-cart/cart-idle.png`,
      walk1: `${MIIMIID_ASSET_BASE}/miimiid-cart/cart-walk-1.png`,
      walk2: `${MIIMIID_ASSET_BASE}/miimiid-cart/cart-walk-2.png`,
      stop: `${MIIMIID_ASSET_BASE}/miimiid-cart/cart-stop.png`,
      happy: `${MIIMIID_ASSET_BASE}/miimiid-cart/cart-happy.png`,
      concerned: `${MIIMIID_ASSET_BASE}/miimiid-cart/cart-concerned.png`
    },

    engineer: {
      accident: `${MIIMIID_ASSET_BASE}/characters/engineer/engineer-accident.png`,
      eating: `${MIIMIID_ASSET_BASE}/characters/engineer/engineer-eating.png`,
      explaining: `${MIIMIID_ASSET_BASE}/characters/engineer/engineer-explaining.png`,
      insideCar: `${MIIMIID_ASSET_BASE}/characters/engineer/engineer-inside-car.png`,
      sad: `${MIIMIID_ASSET_BASE}/characters/engineer/engineer-sad.png`,
      success: `${MIIMIID_ASSET_BASE}/characters/engineer/engineer-success.png`,
      withClient: `${MIIMIID_ASSET_BASE}/characters/engineer/engineer-with-client.png`,
      withSon: `${MIIMIID_ASSET_BASE}/characters/engineer/engineer-with-son.png`
  },

  worlds: {
    bank: {
      accountantPaycheck: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-accountant-paycheck.png`,
      atmMan: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-atm-man.png`,
      atmYoungWoman: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-atm-young-woman.png`,
      customerSupport: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-customer-support.png`,
      lobbyArrivalCap: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-lobby-arrival-cap.png`,
      lobbyArrival: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-lobby-arrival.png`,
      managerCustomerMeeting: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-manager-customer-meeting.png`,
      managerMeetingOlderCustomer: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-manager-meeting-older-customer.png`,
      tellerCashService: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-teller-cash-service.png`,
      worriedCustomerFraudSupport: `${MIIMIID_ASSET_BASE}/world-bank/miimiid-bank-worried-customer-fraud-support.png`
    }
  },

  funCenter: {
    // miimiid-fun-robot.png was never added, so the hero uses the waving pose.
    heroRobot: `${MIIMIID_ASSET_BASE}/characters/miimiid/waving.png`
  },

  products: {
    apple: `${MIIMIID_ASSET_BASE}/products/apple.png`,
    banana: `${MIIMIID_ASSET_BASE}/products/banana.png`,
    bread: `${MIIMIID_ASSET_BASE}/products/bread.png`,
    carrot: `${MIIMIID_ASSET_BASE}/products/carrot.png`,
    cheese: `${MIIMIID_ASSET_BASE}/products/cheese.png`,
    chips: `${MIIMIID_ASSET_BASE}/products/chips.png`,
    eggs: `${MIIMIID_ASSET_BASE}/products/eggs-12.png`,
    milk: `${MIIMIID_ASSET_BASE}/products/milk.png`,
    pasta: `${MIIMIID_ASSET_BASE}/products/pasta.png`,
    sugar: `${MIIMIID_ASSET_BASE}/products/sugar.png`,
    tomato: `${MIIMIID_ASSET_BASE}/products/tomato.png`,
    water: `${MIIMIID_ASSET_BASE}/products/water.png`,
    yogurt: `${MIIMIID_ASSET_BASE}/products/yogurt.png`
  },

  game: {
    shoppingCart: `${MIIMIID_ASSET_BASE}/game/shopping-cart.png`,
    shoppingBasket: `${MIIMIID_ASSET_BASE}/game/shopping-basket.png`,
    checkoutCounter: `${MIIMIID_ASSET_BASE}/game/checkout-counter.png`,
    martStorefront: `${MIIMIID_ASSET_BASE}/world-mart/miimiid-mart-storefront.jpg`,
    martInterior: `${MIIMIID_ASSET_BASE}/world-mart/miimiid-mart-interior.jpg`
  }
});

/*
 * Preload images before a game starts.
 *   miimiidPreloadAssets(MIIMIID_ASSETS.products)
 *   miimiidPreloadAssets(MIIMIID_ASSETS.characters.miimiid)
 * Never rejects. Resolves to { loaded, failed }; failed paths are
 * also logged, which makes broken or misspelled files easy to spot.
 */
function miimiidPreloadAssets(group) {
  const paths = [];
  (function collect(node) {
    Object.values(node).forEach((v) =>
      typeof v === 'string' ? paths.push(v) : collect(v)
    );
  })(group);

  const failed = [];
  return Promise.all(
    paths.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => {
            failed.push(src);
            console.warn('[Miimiid assets] failed to load:', src);
            resolve();
          };
          img.src = src;
        })
    )
  ).then(() => ({ loaded: paths.length - failed.length, failed }));
}

window.MIIMIID_ASSETS = MIIMIID_ASSETS;
window.miimiidPreloadAssets = miimiidPreloadAssets;
