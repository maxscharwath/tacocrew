(() => {


  function getCsrfToken() {

    return document.querySelector("input[name=\"csrf_token\"]")["value"];
  }
  var orderStatusRefreshIntervalId;
  window.addEventListener("scroll", function() {

    var _1843823 = document.querySelector(".whatsapp-icon");
    window.scrollY > 50 && (document.querySelector(".header")["classList"]["add"]("shrink"), _1843823.style["display"] = 'block');
  }), $(document)["ready"](function() {

    $(".modal")['on']("hidden.bs.modal", function() {

      $(".modal-backdrop")["remove"](), $("body")["css"]({
        'overflow': '',
        'padding-right': ''
      });
    });
  }), document.querySelectorAll('.accordion-button')["forEach"](_7617138 => {

    _7617138.addEventListener("click", function() {
      const _5626014 = _7617138.classList.contains("collapsed"),
        _5078411 = _7617138.querySelector("i.fas");
      (document.querySelectorAll(".accordion-button i.fas")["forEach"](_6356566 => {

        _6356566.classList.remove("fa-minus"), _6356566.classList["add"]("fa-plus");
      }), _5626014 ? (_5078411.classList["remove"]("fa-minus"), _5078411.classList["add"]("fa-plus")) : (_5078411.classList.remove('fa-plus'), _5078411.classList["add"]("fa-minus")), !_5626014) && document.querySelector(_7617138.dataset["bsTarget"])["addEventListener"]("shown.bs.collapse", function() {
        const _5296023 = document.querySelector(".header")["offsetHeight"],
          _1630468 = _7617138.getBoundingClientRect()["top"] + window.scrollY - _5296023 - 20;
        window.scrollTo({
          'top': _1630468,
          'behavior': "smooth"
        });
      }, {
        'once': !0
      });
    });
  }), setInterval(function() {

    fetch("ajax/refresh_token.php", {
      'method': "GET",
      'credentials': "same-origin"
    })['then'](_3219473 => {

      if (!_3219473.ok) throw 403 === _3219473.status && console.log("REFRESH TOKEN ERROR"), new Error('REFRESH\x20TOKEN\x20Network\x20response\x20was\x20not\x20ok');
      return _3219473.json();
    })["then"](_1493399 => {

      _1493399.csrf_token && (document.querySelector("input[name=\"csrf_token\"]")["value"] = _1493399.csrf_token);
    })['catch'](_5685309 => console.error("Token yenileme hatas\u0131:", _5685309));
  }, 1800000), document.addEventListener("DOMContentLoaded", function() {
    refreshOrderHistory();
  });

  function refreshOrderHistory() {

    var _9286982 = document.getElementById("orderHistory"),
      _3095916 = JSON.parse(localStorage.getItem("order_stories") || '[]'),
      _8268303 = getCsrfToken();
    fetch("ajax/oh.php", {
      'method': "POST",
      'headers': {
        'Content-Type': "application/json",
        'X-CSRF-Token': _8268303
      },
      'body': JSON.stringify({
        'orders': _3095916.map(_1564870 => ({
          'orderId': _1564870.orderId
        }))
      })
    })['then'](_3154487 => {

      if (!_3154487.ok) throw 403 === _3154487.status && window.location["reload"](), new Error("OH Network response was not ok");
      return _3154487.json();
    })["then"](_2645960 => {

      Array.isArray(_2645960) || (_2645960 = []);
      let _5454990 = !1;
      _2645960.forEach(_1572232 => {
        const _5505575 = _3095916.findIndex(_3273278 => _3273278.orderId === _1572232.orderId); - 1 !== _5505575 && _3095916[_5505575]["OrderData"]["status"] !== _1572232.status && (_3095916[_5505575]["OrderData"]["status"] = _1572232.status, _5454990 = !0);
      }), _9286982.innerHTML = '', _3095916.sort((_5113528, _1268515) => new Date(_1268515.OrderData['date']) - new Date(_5113528.OrderData["date"])), _3095916 = _3095916.slice(0, 3);
      let _1833862 = !1;
      _3095916.forEach(_13020189 => {

        new Date(_13020189.OrderData["date"])['toDateString']() === new Date()["toDateString"]() || 'pending' !== _13020189.OrderData["status"] && "confirmed" !== _13020189.OrderData["status"] && "ondelivery" !== _13020189.OrderData.status ? "pending" !== _13020189.OrderData["status"] && 'confirmed' !== _13020189.OrderData["status"] && 'ondelivery' !== _13020189.OrderData["status"] || (_1833862 = !0) : _13020189.OrderData["status"] = 'delivered';
        const _2327090 = function(_3937618) {
          const _3304620 = _1668924,
            _3582845 = function(_472414) {
              const _2269029 = a0_17364;
              let _7379560 = _2269029(336);
              return _7379560 += buildOrderItemsList(_472414[_2269029(637)], _2269029(632)), _7379560 += buildOrderItemsList(_472414[_2269029(696)], 'Extras'), _7379560 += buildOrderItemsList(_472414[_2269029(560)], _2269029(730)), _7379560 += buildOrderItemsList(_472414[_2269029(724)], 'Desserts'), _7379560 += '</ul>', _7379560;
            }(_3937618),
            _4821971 = document[_3304620(365)](_3304620(621));
          _4821971.className = _3304620(799) + getStatusVariant(_3937618[_3304620(817)]['status']) + '\x20bg-light-subtle\x20border\x20border-' + getStatusVariant(_3937618[_3304620(817)]['status']), _4821971.setAttribute(_3304620(703), _3937618.orderId);
          const _6167822 = new Date()[_3304620(577)](),
            _2165547 = new Date()[_3304620(810)](),
            _5614620 = new Date()['getDay'](),
            _1996534 = 10 === _6167822 && _2165547 >= 0 || 5 === _5614620 && 22 === _6167822 && _2165547 <= 50 || 0 === _5614620 && 22 === _6167822 && _2165547 <= 50 || 5 !== _5614620 && 0 !== _5614620 && 21 === _6167822 && _2165547 <= 50 || _6167822 > 10 && _6167822 < 21;
          let _3635958 = _3304620(514) !== _3937618.OrderData[_3304620(677)] && _3304620(534) !== _3937618[_3304620(817)][_3304620(677)] && 'ondelivery' !== _3937618[_3304620(817)]['status'] && _3304620(486) !== _3937618[_3304620(817)]['status'];
          return _3635958 = _3635958 && _1996534, _4821971[_3304620(634)] = _3304620(583) + function(_1836650, _5966286) {

            switch (_1836650) {
              case _391906(514):
                return _391906(574);
              case _391906(534):
                return _391906(601) === _5966286 ? 'Confirmé\x20pour\x20retrait.' : 'Confirmé.';
              case _391906(792):
                return _391906(595);
              case _391906(434):
                return _391906(594);
              case _391906(486):
                return 'Annulé.';
              default:
                return _391906(450);
            }
          }(_3937618[_3304620(817)]['status'], _3937618[_3304620(817)][_3304620(704)]) + '\x0a' + (_3635958 ? _3304620(352) + _3937618.orderId + _3304620(597) : _3304620(828)) + _3304620(708) + (_3304620(514) === _3937618[_3304620(817)]['status'] ? _3304620(836) + getStatusVariant(_3937618[_3304620(817)][_3304620(677)]) + '-subtle\x20text-danger\x20rounded\x20opacity-75\x22>Votre\x20commande\x20est\x20en\x20cours\x20de\x20confirmation.\x20Les\x20commandes\x20passées\x20pendant\x20les\x20heures\x20ouvrables\x20sont\x20confirmées\x20en\x20quelques\x20secondes.</div>' : '') + '\x0a' + ('confirmed' === _3937618[_3304620(817)][_3304620(677)] ? '<div\x20class=\x22p-2\x20mb-2\x20bg-' + getStatusVariant(_3937618.OrderData[_3304620(677)]) + _3304620(800) + function(_2893479) {

            return 'emporter' === _2893479 ? _11784915(430) : _11784915(377);
          }(_3937618[_3304620(817)][_3304620(704)]) + '</div>' : '') + '\x0a' + (_3304620(792) === _3937618.OrderData[_3304620(677)] ? _3304620(836) + getStatusVariant(_3937618.OrderData[_3304620(677)]) + _3304620(552) : '') + '\x0a' + (_3304620(486) === _3937618[_3304620(817)][_3304620(677)] ? _3304620(836) + getStatusVariant(_3937618.OrderData[_3304620(677)]) + _3304620(429) : '') + '\x0a<p\x20class=\x27card-title\x20text-end\x27>Date\x20de\x20commande:\x20' + _3937618[_3304620(817)]['date'] + _3304620(544) + (_3304620(601) === _3937618[_3304620(817)][_3304620(704)] ? _3304620(655) : _3304620(572)) + _3304620(780) + (_3937618[_3304620(817)]['requestedFor'] ? _3304620(642) + _3937618[_3304620(817)][_3304620(778)] + _3304620(769) : '') + '\x0a' + _3582845 + '\x0a' + (_3304620(354) === _3937618.OrderData[_3304620(704)] ? '<p\x20class=\x27card-subtitle\x20text-end\x20text-muted\x27>Frais\x20de\x20livraison:\x202.00\x20CHF</p>' : '') + _3304620(392) + _3937618[_3304620(817)]['price'] + '\x20CHF</p>\x0a' + ('emporter' === _3937618[_3304620(817)][_3304620(704)] && _3304620(434) !== _3937618[_3304620(817)][_3304620(677)] ? _3304620(640) : '') + '\x0a</div>\x0a', _4821971;
        }(_13020189);
        _9286982.appendChild(_2327090);
      }), _1833862 && !orderStatusRefreshIntervalId ? orderStatusRefreshIntervalId = setInterval(refreshOrderHistory, 15000) : !_1833862 && orderStatusRefreshIntervalId && (clearInterval(orderStatusRefreshIntervalId), orderStatusRefreshIntervalId = null), localStorage.setItem("order_stories", JSON.stringify(_3095916)), _3095916;
    })["catch"](_4550665 => {

      console.error("Fetch Error:", _4550665);
    });
  }

  function buildOrderItemsList(items, sectionLabel) {

    let renderedItems = '';
    "object" != typeof items || null === items || Array.isArray(items) || (items = Object.values(items));
    return Array.isArray(items) && items.forEach(item => {

      let extraDetails = '';
      switch (sectionLabel) {
        case 'Tacos':
          extraDetails = "<br><strong>- Viande(s):</strong> <em>" + item.viande["map"](meat => {
            const quantityLabel = meat.quantity && meat.quantity > 1 ? '\x20x' + meat.quantity : '';
            return meat.name + quantityLabel;
          })["join"](',\x20') + '\x20</em>\x20<br>-\x20<strong>Garnitures:</strong><em>\x20' + item.garniture["map"](garnish => garnish.name)["join"](',\x20') + '\x20</em>\x20<br>-\x20<strong>Sauces:</strong><em>\x20' + item.sauce["map"](sauce => sauce.name)['join'](',\x20') + " </em>", item.tacosNote && (extraDetails += '<br>-\x20<strong>Remarque:</strong>\x20<em>' + item.tacosNote + "</em>");
          break;
        case 'Extras':
          let freeSauceDetails = '';
          if (item.free_sauces && Array.isArray(item.free_sauces) && item.free_sauces["length"] > 0) {
            const sauceNames = item.free_sauces.filter(sauce => sauce.name)["map"](sauce => sauce.name);
            sauceNames.length > 0 && (freeSauceDetails = "<br>- <strong>Sauces offertes:</strong> <em>" + sauceNames.join(',\x20') + "</em>");
          } else item.free_sauce && item.free_sauce["name"] && (freeSauceDetails = "<br>- <strong>Sauce offerte:</strong> <em>" + item.free_sauce["name"] + "</em>");
          extraDetails = freeSauceDetails;
          break;
        default:
          extraDetails = '';
      }
      renderedItems += "<li class='list-group-item'>\n  <span class=\"border rounded py-1 px-2\">" + item.quantity + "</span> x " + item.name + '\x20-\x20' + item.price + '\x20CHF\x20' + extraDetails + "\n  </li>";
    }), renderedItems;
  }

  function getStatusVariant(_2025268) {

    switch (_2025268) {
      case "pending":
      default:
        return "danger";
      case "confirmed":
      case "ondelivery":
        return 'success';
      case "delivered":
        return "secondary";
      case "cancelled":
        return 'light-subtle';
    }
  }
  window.repeatOrder = function(_4981641) {
    const _4629751 = JSON.parse(localStorage.getItem("order_stories"))['find'](_3248151 => _3248151.orderId == _4981641);
    if (!_4629751) return void alert("Order not found.");
    const _1682342 = getCsrfToken(),
      _2776837 = document.querySelector("button[onclick='repeatOrder(" + _4981641 + ")']");
    _2776837.disabled = !0, fetch('ajax/restore_order.php', {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _1682342
      },
      'body': JSON.stringify({
        'order': _4629751
      })
    })["then"](_1242679 => {

      if (!_1242679.ok) throw 403 === _1242679.status && alert("RESTORE ORDER REFRESH"), new Error("RESTORE ORDER Network response was not ok");
      return _1242679.json();
    })["then"](_4882217 => {

      if ("success" === _4882217.status || 'warning' === _4882217.status) {
        const _4959535 = new bootstrap.Modal(document.getElementById("successModal")),
          _1229609 = document.getElementById('successModalBody');
        if ("warning" === _4882217.status) {
          let _6150136 = '';
          _4882217.out_of_stock_items && _4882217.out_of_stock_items["length"] > 0 && (_6150136 = '<div\x20class=\x22alert\x20alert-warning\x20text-start\x20mx-auto\x22\x20style=\x22max-width:\x20500px;\x20background-color:\x20#fff3cd;\x20border-left:\x204px\x20solid\x20#ffc107;\x22><ul\x20style=\x22list-style:\x20none;\x20padding-left:\x200;\x20margin-bottom:\x200;\x22>', _4882217.out_of_stock_items["forEach"](function(_11721680) {

            _6150136 += '<li\x20style=\x22padding:\x208px\x200;\x20border-bottom:\x201px\x20solid\x20#ffeaa7;\x22><i\x20class=\x22fa\x20fa-times-circle\x20text-danger\x20me-2\x22></i><strong>' + _11721680 + "</strong></li>";
          }), _6150136 += "</ul></div>"), _1229609.innerHTML = '<div\x20class=\x22text-center\x22\x20style=\x22padding:\x2020px;\x22><div\x20class=\x22d-flex\x20justify-content-center\x20align-items-center\x20mb-4\x22\x20style=\x22height:\x20100px;\x22><div\x20style=\x22width:\x20100px;\x20height:\x20100px;\x20border-radius:\x2050%;\x20background:\x20linear-gradient(135deg,\x20#ffeaa7\x200%,\x20#fdcb6e\x20100%);\x20display:\x20flex;\x20align-items:\x20center;\x20justify-content:\x20center;\x20box-shadow:\x200\x204px\x2015px\x20rgba(253,\x20203,\x20110,\x200.4);\x22><i\x20class=\x22fa\x20fa-exclamation-triangle\x22\x20style=\x22color:\x20#fff;\x20font-size:\x2050px;\x22></i></div></div><h4\x20class=\x22mb-3\x22\x20style=\x22color:\x20#e17055;\x20font-weight:\x20600;\x22>Certains\x20produits\x20ne\x20sont\x20pas\x20disponibles</h4><p\x20class=\x22mb-4\x22\x20style=\x22color:\x20#636e72;\x20font-size:\x2015px;\x22>Les\x20produits\x20suivants\x20ne\x20sont\x20temporairement\x20pas\x20disponibles\x20et\x20n\x27ont\x20pas\x20été\x20ajoutés\x20à\x20votre\x20panier:</p>' + _6150136 + "<div class=\"alert alert-success mx-auto mt-4\" style=\"max-width: 500px; background-color: #d4edda; border-left: 4px solid #28a745;\"><i class=\"fa fa-check-circle text-success me-2\"></i>Les autres produits ont \u00e9t\u00e9 ajout\u00e9s avec succ\u00e8s.</div><button id=\"continueButton\" class=\"btn btn-danger mt-3\" style=\"min-width: 200px; padding: 12px 24px; font-size: 16px; border-radius: 25px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);\">Continuer vers le panier</button></div>", _4959535.show(), document.getElementById("continueButton")["addEventListener"]("click", function() {

            _4959535.hide(), localStorage.setItem("openOrderModal", "true"), window.location["reload"]();
          });
        } else {
          _1229609.innerHTML = "\n            <div class=\"d-flex justify-content-center align-items-center\" style=\"height: 100px;\">\n              <i class=\"fa fa-check-circle\" style=\"color: green; font-size: 50px;\"></i>\n            </div>\n            Les produits sont \u00e0 nouveau ajout\u00e9s \u00e0 votre panier. <br />\n            La page sera actualis\u00e9e dans <span id=\"countdown\">3</span> secondes.\n          ", _4959535.show();
          let _3365754 = 3;
          const _3748466 = document.getElementById('countdown'),
            _2573555 = setInterval(() => {
              const _3113142 = _3170210;
              _3365754--, _3748466[_3113142(440)] = _3365754, 0 === _3365754 && (clearInterval(_2573555), _4959535.hide(), localStorage[_3113142(641)]('openOrderModal', _3113142(593)), window[_3113142(390)][_3113142(635)]());
            }, 1000);
        }
      } else alert("Error during repeat order. Please try again later."), _2776837.disabled = !1;
    })["catch"](_6202670 => {

      console.error('Error:', _6202670), alert("Error during repeat order. Please try again later."), _2776837.disabled = !1;
    });
  }, document.addEventListener("DOMContentLoaded", function() {

    if ("true" === localStorage.getItem('openOrderModal')) {
      localStorage.removeItem('openOrderModal'), new bootstrap[("Modal")](document.getElementById('orderModal'))["show"]();
      var _2452856 = getCsrfToken();
      fetch("ajax/os.php", {
        'method': "POST",
        'headers': {
          'Content-Type': "application/x-www-form-urlencoded"
        },
        'body': 'csrf_token=' + encodeURIComponent(_2452856)
      })["then"](_5958031 => {

        if (!_5958031.ok) throw 403 === _5958031.status && console.log("OS REFRESH"), new Error("Network response was not ok");
        return _5958031.text();
      })["then"](_4712209 => {

        document.querySelector("#orderModal .order-summary")["innerHTML"] = _4712209;
      })['catch'](_1671635 => console.error("Error loading the order summary:", _1671635));
    }
  }), document.querySelectorAll(".accordion-button")["forEach"](_2257505 => {

    _2257505.addEventListener("click", function() {
      const _1535010 = this.dataset["bsTarget"],
        _5422454 = {
          'activeSection': this.classList["contains"]("collapsed") ? null : _1535010,
          'timestamp': new Date()["getTime"]()
        };
      localStorage.setItem("accordionState", JSON.stringify(_5422454));
    });
  }), document.addEventListener('DOMContentLoaded', function() {
    const _4583591 = localStorage.getItem("accordionState");
    if (_4583591) {
      const {
        activeSection: _1460773,
        timestamp: _4023513
      } = JSON.parse(_4583591);
      if (new Date()["getTime"]() - _4023513 < 3600000 && _1460773) {
        const _8656527 = document.querySelector(_1460773);
        _8656527 && new bootstrap.Collapse(_8656527, {
          'toggle': !1
        })["show"]();
      } else localStorage.removeItem("accordionState");
    }
  }), document.addEventListener("DOMContentLoaded", function() {

    document.body["addEventListener"]("click", function(_1755600) {

      _1755600.target["matches"](".increase-quantity") && sendTacoQuantityUpdate('increaseQuantity', _1755600.target["dataset"]["index"]), _1755600.target["matches"](".decrease-quantity") && sendTacoQuantityUpdate('decreaseQuantity', _1755600.target["dataset"]["index"]);
    });
  });
  var meatCheckboxes, sauceCheckboxes, garnishCheckboxes, tacoQuantityCsrfToken = getCsrfToken();

  function sendTacoQuantityUpdate(action, tacoIndex) {

    const request = new XMLHttpRequest();
    request.open("POST", "ajax/owt.php", !0);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.setRequestHeader('X-CSRF-Token', tacoQuantityCsrfToken);
    request.onload = function() {

      if (200 === request.status) {
        refreshTacoListUI();
        const response = JSON.parse(this.responseText);
        if ("success" === response.status) {
          const quantityInput = document.querySelector("#tacos-" + tacoIndex + '\x20.quantity-input');
          quantityInput ? (quantityInput.value = response.quantity, refreshCartSummary()) : console.error("Quantity input not found for index: " + tacoIndex);
        } else alert("Error during processing.");
      } else console.error("Request failed with status " + request.status + ':\x20' + request.statusText);
    };
    request.send("action=" + action + '&index=' + tacoIndex);
  }

  function applyEditSelectionLimits(selectedTacoSize) {

    [...meatCheckboxes, ...sauceCheckboxes]["forEach"](input => input.disabled = !1);
    let maxAllowedMeats = 0;
    switch (selectedTacoSize) {
      case "tacos_L":
        maxAllowedMeats = 1;
        break;
      case "tacos_BOWL":
        maxAllowedMeats = 2;
        break;
      case 'tacos_L_mixte':
      case "tacos_XL":
        maxAllowedMeats = 3;
        break;
      case "tacos_XXL":
        maxAllowedMeats = 4;
        break;
      case "tacos_GIGA":
        maxAllowedMeats = 5;
        break;
      default:
        [...meatCheckboxes, ...sauceCheckboxes]["forEach"](input => input.disabled = !0);
        return;
    }
    (function(meatLimit) {

      let currentlySelectedMeats = [...meatCheckboxes]["filter"](checkbox => checkbox.checked)["length"];
      meatCheckboxes.forEach(checkbox => {

        checkbox.disabled = currentlySelectedMeats >= meatLimit && !checkbox.checked;
      }), meatCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {

          let updatedSelectedMeats = [...meatCheckboxes]["filter"](meatInput => meatInput.checked)["length"];
          meatCheckboxes.forEach(meatInput => {

            meatInput.disabled = updatedSelectedMeats >= meatLimit && !meatInput.checked;
          });
        });
      });
    })(maxAllowedMeats),
    function(sauceLimit) {

      let selectedSauceCount = [...sauceCheckboxes]["filter"](checkbox => checkbox.checked)["length"];
      sauceCheckboxes.forEach(checkbox => {

        checkbox.disabled = selectedSauceCount >= sauceLimit && !checkbox.checked;
      }), sauceCheckboxes.forEach(checkbox => {

        checkbox.addEventListener('change', () => {

          let updatedSauceCount = [...sauceCheckboxes]["filter"](sauceInput => sauceInput.checked)["length"];
          sauceCheckboxes.forEach(sauceInput => {

            sauceInput.disabled = updatedSauceCount >= sauceLimit && !sauceInput.checked;
          });
        });
      });
    }(3);
  }

  function submitExtraSelection(_6064893, _7293539, _4051149, _4767312, _5688905 = null, _4707586 = '', _4981981 = null) {

    var _4464762 = getCsrfToken();
    const _3447079 = {
      'id': _6064893,
      'name': _7293539,
      'price': _4051149,
      'quantity': _4767312,
      'free_sauce': _5688905 ? {
        'id': _5688905,
        'name': _4707586,
        'price': 0
      } : void 0,
      'free_sauces': _4981981
    };
    fetch("ajax/ues.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _4464762
      },
      'body': JSON.stringify(_3447079)
    })["then"](_5865212 => _5865212.json())["then"](_1470504 => {
      refreshCartSummary();
    })["catch"](_3821399 => console.error("Error:", _3821399));
  }

  function refreshCategoryBadges() {

    const csrfToken = getCsrfToken();
    fetch("ajax/sd.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': csrfToken
      }
    })["then"](response => {

      if (!response.ok) throw 403 === response.status && console.log('SD\x20REFRESH'), new Error('Network\x20response\x20was\x20not\x20ok');
      return response.json();
    })["then"](categorySummary => {

      Object.entries(categorySummary)["forEach"](([categoryKey, summary]) => {
        const totalQuantity = summary.totalQuantity,
          totalPrice = summary.totalPrice;
        let sectionId;
        switch (categoryKey) {
          case 'tacos':
            sectionId = "createTacos";
            break;
          case "extras":
            sectionId = "selectSnacks";
            break;
          case 'boissons':
            sectionId = 'selectDrinks';
            break;
          case 'desserts':
            sectionId = 'selectDesserts';
            break;
          default:
            console.error("Unknown category:", categoryKey);
            return;
        }
        const badge = document.querySelector('#' + sectionId + " .accordion-button .badge");
        if (badge) {
          if (totalQuantity > 0) {
            const productLabel = totalQuantity > 1 ? "produits" : "produit";
            badge.textContent = totalQuantity + '\x20' + productLabel + " total " + totalPrice + "CHF", badge.style["display"] = '';
          } else badge.style["display"] = "none";
        }
      });
    })["catch"](error => console.error("Error:", error));
  }

  function refreshCartSummary() {

    const csrfToken = getCsrfToken();
    fetch('ajax/cs.php', {
      'method': "POST",
      'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
        'X-CSRF-Token': csrfToken
      }
    })["then"](response => {

      if (!response.ok) throw 403 === response.status && console.log("CS REFRESH"), new Error("CS Network response was not ok");
      return response.json();
    })["then"](payload => {

      document.getElementById("cart-summary")["innerHTML"] = payload.message, refreshCategoryBadges();
    })["catch"](error => console.error("Hata:", error));
  }

  function toggleTacoOptionsBySize(_4767214, _3702857) {

    var _4246287 = ["viande_hachee", "escalope_de_poulet", 'merguez', "soudjouk", "falafel_vegetarien", "sans_viande"],
      _15223349 = ["cordon_bleu", "nuggets", "tenders", "kebab_agneau"],
      _5340277 = ['cheddar', "gruyere", "frites"];
    'tacos_BOWL' === _4767214 ? (_4246287.concat(_15223349)['forEach'](function(_4537280) {
      const _1259985 = document.querySelector("input[name=\"viande[]\"][value=\"" + _4537280 + '\x22]');
      _1259985 && !_1259985.checked && (_1259985.disabled = !1);
    }), _4246287.concat(_15223349)["forEach"](function(_6156411) {

      document.getElementById(_3702857 + _6156411 + "_div")['style']["display"] = "block";
    }), _5340277.forEach(function(_2553108) {

      document.getElementById(_3702857 + _2553108 + '_div')['style']["display"] = 'none';
    }), document.getElementById(_3702857 + "frites_note")["style"]["display"] = "block") : (_4246287.concat(_15223349)["forEach"](function(_1352330) {

      document.getElementById(_3702857 + _1352330 + "_div")["style"]["display"] = "block";
    }), _5340277.forEach(function(_2991954) {

      document.getElementById(_3702857 + _2991954 + "_div")["style"]["display"] = "block";
    }), document.getElementById(_3702857 + "frites_note")["style"]['display'] = 'none');
  }

  function resetTacoForm() {

    document.getElementById('tacosForm')["reset"](), [...meatCheckboxes, ...sauceCheckboxes, ...garnishCheckboxes]["forEach"](_4740026 => {

      _4740026.checked = !1, _4740026.disabled = !1;
    });
  }

  function refreshTacoListUI() {

    0 === $("#products-list")["children"]()["length"] ? ($('#product-messages')["html"]("<p class=\"fst-italic\">Veuillez commencer par choisir la taille de vos tacos.</p>"), $("div:contains(\"Tacos dans votre panier\")")['remove']()) : $("#product-messages")["html"]('<div\x20class=\x22bg-danger\x20rounded\x20text-light\x20p-2\x22\x20role=\x22alert\x22><i\x20class=\x22fa-solid\x20fa-chevron-down\x22></i>\x20Tacos\x20dans\x20votre\x20panier</div>'), $("#products-list .card")["each"](function(_1415202) {

      $(this)["attr"]('id', 'tacos-' + _1415202), $(this)['attr']("data-index", _1415202), $(this)["find"](".delete-tacos")["attr"]("data-index", _1415202);
    });
  }

  function loadExistingTacos() {

    var _2331192 = getCsrfToken();
    $["ajax"]({
      'type': "POST",
      'url': "ajax/owt.php",
      'headers': {
        'X-CSRF-Token': _2331192
      },
      'data': {
        'loadProducts': !0
      },
      'success': function(_4091896) {

        $("#products-list")['html'](_4091896), refreshTacoListUI(), refreshCartSummary();
      },
      'error': function() {

        location.reload();
      }
    });
  }
  document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("orderAccordion")["addEventListener"]("click", function(_2228644) {
      const _13656588 = _2228644.target["closest"]('.edit-tacos');
      if (_13656588) {
        _2228644.preventDefault();
        const _4104918 = _13656588.getAttribute('data-index'),
          _2690183 = getCsrfToken();
        document.getElementById('editIndex')["value"] = _4104918, fetch("ajax/gtd.php", {
          'method': "POST",
          'headers': {
            'X-CSRF-Token': _2690183,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          'body': "index=" + _4104918
        })["then"](_4806479 => {

          if (!_4806479.ok) throw 403 === _4806479.status && console.log("GTD REFRESH"), new Error("GTD Network response was not ok");
          return _4806479.json();
        })["then"](_3319025 => {

          if ("success" === _3319025.status) {
            const {
              taille: _1545740,
              viande: _15861891,
              garniture: _5913165,
              sauce: _1212562,
              tacosNote: _4801310
            } = _3319025.data;
            console.log('Loaded\x20tacos\x20data:', _3319025.data), console.log("Viande data:", _15861891), document.getElementById("editSelectProduct")['value'] = _1545740, document.getElementById("editTaille")['value'] = _1545740, document.getElementById("editTacosNote")["value"] = _4801310, document.querySelectorAll("#tacosEditForm input[type=\"checkbox\"]")['forEach'](_5456612 => {

                _5456612.checked = !1;
              }),
              function(_5390561, _2919463, _13646940, _4151770) {

                document.querySelectorAll("#tacosEditForm input[type=\"checkbox\"]")["forEach"](_5053201 => {

                  _5053201.checked = !1, _5053201.disabled = !1;
                }), document.querySelectorAll("#tacosEditForm .meat-quantity-control")["forEach"](_2223868 => {

                  _2223868.classList["add"]("d-none");
                  const _4208834 = _2223868.querySelector('.meat-quantity-input');
                  _4208834 && (_4208834.value = 1, _4208834.disabled = !0);
                });
                let _5562037 = 1;
                switch (_4151770) {
                  case "tacos_L":
                    _5562037 = 1;
                    break;
                  case "tacos_L_mixte":
                  case "tacos_XL":
                    _5562037 = 3;
                    break;
                  case 'tacos_XXL':
                    _5562037 = 4;
                    break;
                  case "tacos_GIGA":
                    _5562037 = 5;
                }
                _5390561.forEach(_15164666 => {
                  const _2816047 = document.querySelector('#tacosEditForm\x20input[name=\x22viande[]\x22][value=\x22' + _15164666.slug + '\x22]');
                  if (_2816047 && (_2816047.checked = !0, _5562037 > 1)) {
                    const _1800046 = _2816047.closest(".meat-selection-row");
                    if (_1800046) {
                      const _5670229 = _1800046.querySelector(".meat-quantity-control"),
                        _3707030 = _1800046.querySelector(".meat-quantity-input");
                      _5670229 && _3707030 && (_5670229.classList.remove("d-none"), _3707030.value = _15164666.quantity || 1, _3707030.disabled = !1);
                    }
                  }
                }), _2919463.forEach(_1190898 => {
                  const _4829836 = document.querySelector("#tacosEditForm input[name=\"garniture[]\"][value=\"" + _1190898.slug + '\x22]');
                  _4829836 && (_4829836.checked = !0);
                }), _13646940.forEach(_5105213 => {
                  const _3093328 = document.querySelector('#tacosEditForm\x20input[name=\x22sauce[]\x22][value=\x22' + _5105213.slug + '\x22]');
                  _3093328 && (_3093328.checked = !0);
                }), applyEditSelectionLimits(_4151770);
              }(_15861891, _5913165, _1212562, _1545740), new bootstrap[("Modal")](document.getElementById("tacosEditModal"))['show']();
          } else console.error("Failed to fetch tacos details:", _3319025.message), console.log("Connection error. Please refresh the page.");
        })['catch'](_4531010 => console.error('Error:', _4531010));
      }
    });
  }), document.addEventListener("DOMContentLoaded", function() {

    document.getElementById('tacosEditForm')["addEventListener"]('submit', function(_4128560) {

      _4128560.preventDefault();
      const _2983214 = document.getElementById("editSelectProduct")['value'],
        _5810179 = document.querySelectorAll("#tacosEditForm input[name=\"viande[]\"]:checked"),
        _4279475 = document.querySelectorAll("#tacosEditForm input[name=\"sauce[]\"]:checked"),
        _1882471 = document.querySelectorAll("#tacosEditForm input[name=\"garniture[]\"]:checked");
      if (0 === _5810179.length) return alert("Veuillez s\u00e9lectionner au moins une viande ou cocher \"sans viande\"."), !1;
      if (0 === _4279475.length) return alert("Veuillez s\u00e9lectionner au moins une sauce ou cocher \"sans sauce\"."), !1;
      if ("tacos_BOWL" !== _2983214 && 0 === _1882471.length) return alert('Veuillez\x20sélectionner\x20au\x20moins\x20une\x20garniture\x20ou\x20cocher\x20\x22sans\x20garniture\x22.'), !1;
      var _4863964 = new FormData(this);
      _5810179.forEach(_3210333 => {
        const _4551296 = _3210333.value,
          _4701294 = _3210333.closest(".meat-selection-row"),
          _3597691 = _4701294 ? _4701294.querySelector(".meat-quantity-input") : null,
          _2343150 = _3597691 && parseInt(_3597691.value, 10) || 1;
        _4863964.append("meat_quantity[" + _4551296 + ']', _2343150);
      });
      var _3765629 = getCsrfToken();
      fetch("ajax/et.php", {
        'method': 'POST',
        'headers': {
          'X-CSRF-Token': _3765629
        },
        'body': _4863964
      })["then"](_5772796 => {

        if (!_5772796.ok) throw new Error("ET Network response was not ok");
        return _5772796.text();
      })["then"](_3916439 => {

        $("#tacosEditModal")["modal"]("hide"), loadExistingTacos(), refreshTacoListUI(), refreshCartSummary();
      })["catch"](_2273549 => console.error("Error:", _2273549));
    });
  }), document.addEventListener("DOMContentLoaded", function() {
    const _13593625 = document.querySelectorAll("input[name=\"extras\"]"),
      _2341805 = getCsrfToken();
    fetch("ajax/gse.php", {
      'method': 'POST',
      'headers': {
        'X-CSRF-Token': _2341805
      }
    })["then"](_2622956 => {

      if (!_2622956.ok) throw 403 === _2622956.status && console.log("GSE REFRESH"), new Error("GSE Network response was not ok");
      return _2622956.json();
    })['then'](_1681894 => {

      Object.values(_1681894)["forEach"](_2534218 => {
        const _2877287 = document.getElementById(_2534218.id);
        if (_2877287) {
          _2877287.checked = !0;
          const _10093852 = _2877287.closest(".form-check")["querySelector"](".extras-quantity-control");
          _10093852.classList["remove"]("d-none"), _10093852.querySelector(".quantity-input")["value"] = _2534218.quantity;
          const _6184293 = document.getElementById("free_sauce_select_" + _2534218.id);
          if (_6184293) {
            if (_6184293.classList.remove('d-none'), _2534218.free_sauces && Array.isArray(_2534218.free_sauces)) _6184293.querySelectorAll('select')['forEach']((_5218442, _1537479) => {

              _2534218.free_sauces[_1537479] && _2534218.free_sauces[_1537479]['id'] && (_5218442.value = _2534218.free_sauces[_1537479]['id']);
            });
            else {
              if (_2534218.free_sauce && _2534218.free_sauce.id) {
                const _5856007 = _6184293.querySelector("select");
                _5856007 && (_5856007.value = _2534218.free_sauce.id);
              }
            }
          }
        }
      });
    })["catch"](_3482257 => console.error("Error:", _3482257)), (document.querySelectorAll(".free-sauces-container")["forEach"](_4487055 => {
      const _6173340 = _4487055.id["replace"]('free_sauce_select_', ''),
        _5661975 = document.getElementById(_6173340);
      _5661975 && _5661975.checked || _4487055.classList["add"]("d-none");
    }), _13593625.forEach(_3335983 => {

      _3335983.addEventListener("change", function() {
        const _9627935 = this.closest(".form-check")["querySelector"]('.extras-quantity-control'),
          _2923242 = document.getElementById("free_sauce_select_" + this.id);
        this.checked ? (_9627935.classList["remove"]("d-none"), _2923242 && _2923242.classList.remove("d-none")) : (_9627935.classList['add']('d-none'), _9627935.querySelector(".quantity-input")["value"] = 1, _2923242 && (_2923242.classList.add("d-none"), _2923242.querySelectorAll("select")['forEach'](_5032782 => {

          _5032782.value = '';
        })));
        const _2612948 = this.checked,
          _4402379 = _2612948 ? parseInt(_9627935.querySelector(".quantity-input")["value"], 10) : 0,
          _4184102 = this.id,
          _16517533 = this.getAttribute("value"),
          _5714374 = this.closest(".form-check")['querySelector'](".extras-info")["textContent"],
          _3655970 = parseFloat(_5714374.replace("CHF ", '')) || 0.5;
        ['extra_frites', "extra_nuggets", "extra_falafel", "extra_tenders", 'extra_onion_rings', "extra_pommes_gaufrettes", 'extra_mozarella_sticks', "extra_potatoes", 'extra_gaufrettes']["includes"](_4184102) && _2923242 && _2612948 ? submitExtraSelectionWithSauces(_4184102) : submitExtraSelection(_4184102, _16517533, _3655970, _4402379);
      });
    }), document.querySelectorAll('.free-sauces-container\x20select')["forEach"](_4102619 => {
      _4102619.addEventListener('change', handleFreeSauceSelectionChange);
    }), document.querySelectorAll(".extras-quantity-control .increase, .extras-quantity-control .decrease")["forEach"](_3818387 => {

      _3818387.addEventListener("click", function() {
        const _2394003 = _3818387.closest('.extras-quantity-control')["querySelector"](".quantity-input");
        let _3080102 = parseInt(_2394003.value, 10);
        const _1112221 = _3818387.closest(".form-check")["querySelector"](".extra-checkbox"),
          _1401121 = _1112221.id,
          _5819295 = _1112221.getAttribute("value"),
          _3701350 = _1112221.closest(".form-check")["querySelector"]('.extras-info')["textContent"],
          _1720378 = parseFloat(_3701350.replace("CHF ", '')) || 0.5;
        _3818387.classList["contains"]('increase') ? _3080102++ : _3080102 > 1 && _3080102--, _2394003.value = _3080102, ["extra_frites", "extra_nuggets", "extra_falafel", 'extra_tenders', "extra_onion_rings", "extra_pommes_gaufrettes", "extra_mozarella_sticks", "extra_potatoes", "extra_gaufrettes"]["includes"](_1401121) ? (! function(_6133766, _3215536) {
          const _5332090 = "localhost" === window.location["hostname"] || "127.0.0.1" === window.location["hostname"];
          _5332090 && console.log("updateFreeSauceOptions called with:", _6133766, _3215536);
          const _2201295 = document.getElementById('free_sauce_select_' + _6133766);
          if (!_2201295) return void(_5332090 && console.log("No container found for:", 'free_sauce_select_' + _6133766));
          const _5358119 = _2201295.querySelectorAll("select"),
            _5222815 = [];
          _5358119.forEach(_3294348 => {

            _3294348.value && _5222815.push(_3294348.value);
          }), _5332090 && console.log("Saved selections:", _5222815), (_2201295.innerHTML = '', _5332090 && console.log("Creating", _3215536, 'sauce\x20options'));
          for (let _5980773 = 1; _5980773 <= _3215536; _5980773++) {
            const _4724481 = document.createElement("div");
            _4724481.className = "free-sauce-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center mb-2 mt-1";
            const _10683138 = _5222815[_5980773 - 1] || '';
            let _5942225 = "<option value=\"\" disabled>Choisissez votre sauce offerte ici.</option>";
            window.availableSauces && Array.isArray(window.availableSauces) && (_5942225 = '<option\x20value=\x22\x22\x20disabled\x20' + (_10683138 ? '' : "selected") + ">Choisissez votre sauce offerte ici.</option>", window.availableSauces["forEach"](_1075874 => {
              const _3496827 = _10683138 === _1075874.id ? "selected" : '';
              _5942225 += "<option value=\"" + _1075874.id + '\x22\x20' + _3496827 + '>' + _1075874.name + '</option>';
            })), _4724481.innerHTML = "\n      <i class=\"fa-solid fa-angles-up\" style=\"font-size: 22px; margin-right: 8px; color:#dc3545\"></i>\n      <span class=\"text-danger me-2\">" + _5980773 + ".</span>\n      <select class=\"form-control text-danger form-select-sm\" name=\"free_sauce_" + _6133766 + "[]\" data-item-index=\"" + _5980773 + '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' + _5942225 + "\n      </select>\n    ", _2201295.appendChild(_4724481);
          }
          _5332090 && console.log("Created", _3215536, "sauce options for", _6133766), ! function(_4247596) {
            const _2110935 = document.querySelectorAll("#free_sauce_select_" + _4247596 + " select");
            _2110935.forEach(_2671598 => {

              _2671598.removeEventListener("change", handleFreeSauceSelectionChange), _2671598.addEventListener("change", handleFreeSauceSelectionChange);
            });
          }(_6133766);
        }(_1401121, _3080102), submitExtraSelectionWithSauces(_1401121)) : submitExtraSelection(_1401121, _5819295, _1720378, _3080102);
      });
    })), document.querySelectorAll(".free-sauce-checkbox")["forEach"](_548660 => {

      _548660.addEventListener("change", function() {
        const _5440961 = document.getElementById("free_sauce_" + this.id);
        this.checked ? _5440961.classList["remove"]("d-none") : _5440961.classList.add("d-none"), _5440961.querySelector('select')["addEventListener"]("change", function() {

          submitExtraSelection(this.value, this.options[this.selectedIndex]["text"], 0, 1);
        });
      });
    });
  }), document.addEventListener('DOMContentLoaded', function() {
    const _5232365 = document.querySelectorAll("input[name=\"boissons\"]");

    function submitDrinkSelection(_9329247, _1330422, _5393734, _2876931) {

      var _3860621 = getCsrfToken();
      const _2525962 = {
        'id': _9329247,
        'name': _1330422,
        'price': _5393734,
        'quantity': _2876931
      };
      fetch('ajax/ubs.php', {
        'method': 'POST',
        'headers': {
          'X-CSRF-Token': _3860621
        },
        'body': JSON.stringify(_2525962)
      })["then"](_2880450 => _2880450.json())['then'](_2337037 => {
        refreshCartSummary();
      })["catch"](_4223432 => console.error("Error:", _4223432));
    }
    const _2039061 = getCsrfToken();
    fetch("ajax/gsb.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _2039061
      }
    })["then"](_3344223 => {

      if (!_3344223.ok) throw 403 === _3344223.status && console.log('GSB\x20REFRESH'), new Error('GSB\x20Network\x20response\x20was\x20not\x20ok');
      return _3344223.json();
    })["then"](_5133915 => {

      Object.values(_5133915)['forEach'](_5839348 => {
        const _3004714 = document.getElementById(_5839348.id);
        if (_3004714) {
          _3004714.checked = !0;
          const _2187122 = _3004714.closest(".form-check")['querySelector']('.boisson-quantity-control');
          _2187122.classList["remove"]("d-none"), _2187122.querySelector(".quantity-input")['value'] = _5839348.quantity;
        }
      });
    })['catch'](_4498822 => console.error("Error:", _4498822)), _5232365.forEach(_1967006 => {

      _1967006.addEventListener('change', function() {
        const _4383964 = this.closest(".form-check")["querySelector"]('.boisson-quantity-control');
        this.checked ? _4383964.classList["remove"]("d-none") : (_4383964.classList["add"]("d-none"), _4383964.querySelector('.quantity-input')["value"] = 1);
        const _2321475 = this.checked ? parseInt(_4383964.querySelector(".quantity-input")["value"], 10) : 0,
          _4421765 = this.id,
          _2193412 = this.getAttribute('value'),
          _4845164 = this.closest('.form-check')['querySelector'](".boissons-info")["textContent"];
        submitDrinkSelection(_4421765, _2193412, parseFloat(_4845164.replace("CHF ", '')) || 0.5, _2321475);
      });
    }), document.querySelectorAll('.boisson-quantity-control\x20.increase,\x20.boisson-quantity-control\x20.decrease')["forEach"](_3154546 => {

      _3154546.addEventListener("click", function() {
        const _14562462 = this.closest('.boisson-quantity-control')["querySelector"](".quantity-input");
        let _3026104 = parseInt(_14562462.value, 10);
        _3026104 += this.classList["contains"]("increase") ? 1 : _3026104 > 1 ? -1 : 0, _14562462.value = _3026104;
        const _2132757 = this.closest(".boisson-quantity-control")["getAttribute"]("data-boisson-id"),
          _3881611 = document.getElementById(_2132757),
          _3302025 = _3881611.getAttribute("value"),
          _2261264 = _3881611.closest(".form-check")["querySelector"](".boissons-info")["textContent"];
        submitDrinkSelection(_2132757, _3302025, parseFloat(_2261264.replace("CHF ", '')) || 0.5, _3026104);
      });
    });
  }), document.addEventListener('DOMContentLoaded', function() {
    const _4740241 = document.querySelectorAll("input[name=\"desserts\"]");

    function submitDessertSelection(_4877569, _5983730, _4498168, _1848116) {

      var _4452466 = getCsrfToken();
      const _15895237 = {
        'id': _4877569,
        'name': _5983730,
        'price': _4498168,
        'quantity': _1848116
      };
      fetch("ajax/uds.php", {
        'method': "POST",
        'headers': {
          'X-CSRF-Token': _4452466
        },
        'body': JSON.stringify(_15895237)
      })['then'](_5954986 => _5954986.json())['then'](_3801760 => {
        refreshCartSummary();
      })["catch"](_1248463 => console.error("Error:", _1248463));
    }
    const _1152261 = getCsrfToken();
    fetch("ajax/gsd.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _1152261
      }
    })['then'](_4132809 => {

      if (!_4132809.ok) throw 403 === _4132809.status && console.log('GSD\x20REFRESH'), new Error("GSD Network response was not ok");
      return _4132809.json();
    })["then"](_1049997 => {

      Object.values(_1049997)["forEach"](_3777478 => {
        const _5620687 = document.getElementById(_3777478.id);
        if (_5620687) {
          _5620687.checked = !0;
          const _4614310 = _5620687.closest('.form-check')["querySelector"](".dessert-quantity-control");
          _4614310.classList["remove"]('d-none'), _4614310.querySelector('.quantity-input')["value"] = _3777478.quantity;
        }
      });
    })["catch"](_3547958 => console.error('Error:', _3547958)), _4740241.forEach(_1504629 => {

      _1504629.addEventListener("change", function() {
        const _4540472 = this.closest(".form-check")["querySelector"](".dessert-quantity-control");
        this.checked ? _4540472.classList["remove"]("d-none") : (_4540472.classList["add"]("d-none"), _4540472.querySelector(".quantity-input")['value'] = 1);
        const _1771294 = this.checked ? parseInt(_4540472.querySelector('.quantity-input')["value"], 10) : 0,
          _4421943 = this.id,
          _1927188 = this.getAttribute('value'),
          _2441373 = this.closest('.form-check')["querySelector"](".desserts-info")["textContent"];
        submitDessertSelection(_4421943, _1927188, parseFloat(_2441373.replace('CHF\x20', '')) || 0.5, _1771294);
      });
    }), document.querySelectorAll(".dessert-quantity-control .increase, .dessert-quantity-control .decrease")['forEach'](_2994398 => {

      _2994398.addEventListener("click", function() {
        const _6186605 = this.closest(".dessert-quantity-control")["querySelector"](".quantity-input");
        let _4345274 = parseInt(_6186605.value, 10);
        _4345274 += this.classList.contains('increase') ? 1 : _4345274 > 1 ? -1 : 0, _6186605.value = _4345274;
        const _2994107 = this.closest(".dessert-quantity-control")["getAttribute"]("data-dessert-id"),
          _3118142 = document.getElementById(_2994107),
          _2490159 = _3118142.getAttribute("value"),
          _2501207 = _3118142.closest(".form-check")['querySelector'](".desserts-info")['textContent'];
        submitDessertSelection(_2994107, _2490159, parseFloat(_2501207.replace('CHF\x20', '')) || 0.5, _4345274);
      });
    });
  }), document.addEventListener('DOMContentLoaded', refreshCategoryBadges), document.addEventListener("DOMContentLoaded", refreshCartSummary), document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("orderModal")["addEventListener"]("show.bs.modal", function(_1763247) {

      var _4745250 = getCsrfToken();
      fetch("ajax/os.php", {
        'method': 'POST',
        'headers': {
          'Content-Type': "application/x-www-form-urlencoded"
        },
        'body': "csrf_token=" + encodeURIComponent(_4745250)
      })["then"](_1694643 => {

        if (!_1694643.ok) throw 403 === _1694643.status && console.log("OS REFRESH"), new Error("Network response was not ok");
        return _1694643.text();
      })["then"](_1211815 => {
        document.querySelector('#orderModal\x20.order-summary')['innerHTML'] = _1211815;
      })["catch"](_3926110 => console.error('Error\x20loading\x20the\x20order\x20summary:', _3926110));
    });
  }), document.getElementById("selectProduct")['addEventListener']('change', function() {

    toggleTacoOptionsBySize(this.value, "add_");
  }), document.getElementById("tacosEditModal")['addEventListener']("show.bs.modal", function() {

    toggleTacoOptionsBySize(document.getElementById("editTaille")['value'], "edit_");
  }), document.addEventListener("DOMContentLoaded", function() {

    document.querySelector("#confirmMinOrderModal .btn-danger")["addEventListener"]("click", function() {

      new bootstrap.Modal(document.getElementById('confirmMinOrderModal'))["hide"](), setTimeout(function() {

        new bootstrap[("Modal")](document.getElementById("orderModal"))['show']();
      }, 500);
    });
  }), document.addEventListener("DOMContentLoaded", function() {
    const _6928111 = document.getElementById("selectProduct");

    function setInputsDisabled(_6700950, _3200351 = !0) {

      _6700950.forEach(_8548585 => {

        _8548585.disabled = _3200351, _3200351 && (_8548585.checked = !1);
      });
    }

    function enforceMeatSelectionLimit(_2254693) {

      let _1475473 = [...meatCheckboxes]["filter"](_2574001 => _2574001.checked)["length"];
      meatCheckboxes.forEach(_5999727 => {
        _5999727.addEventListener('change', () => {

          _1475473 = [...meatCheckboxes]["filter"](_3017667 => _3017667.checked)["length"], _1475473 >= _2254693 ? setInputsDisabled([...meatCheckboxes]["filter"](_5995457 => !_5995457.checked), !0) : setInputsDisabled(meatCheckboxes, !1);
        });
      });
    }
    meatCheckboxes = document.querySelectorAll("input[name=\"viande[]\"]"), sauceCheckboxes = document.querySelectorAll("input[name=\"sauce[]\"]"), garnishCheckboxes = document.querySelectorAll("input[name=\"garniture[]\"]"), _6928111.addEventListener('change', () => {

      [...meatCheckboxes, ...sauceCheckboxes, ...garnishCheckboxes]["forEach"](_11668014 => {

        _11668014.checked = !1;
      });
      const _1666559 = _6928111.value;
      switch (setInputsDisabled(meatCheckboxes, !1), setInputsDisabled(sauceCheckboxes, !1), setInputsDisabled(garnishCheckboxes, !1), _1666559) {
        case 'tacos_L':
          enforceMeatSelectionLimit(1);
          break;
        case "tacos_BOWL":
          enforceMeatSelectionLimit(2);
          break;
        case "tacos_L_mixte":
        case "tacos_XL":
          enforceMeatSelectionLimit(3);
          break;
        case 'tacos_XXL':
          enforceMeatSelectionLimit(4);
          break;
        case "tacos_GIGA":
          enforceMeatSelectionLimit(5);
          break;
        default:
          setInputsDisabled(meatCheckboxes, !0), setInputsDisabled(sauceCheckboxes, !0), setInputsDisabled(garnishCheckboxes, !0);
      }
      sauceCheckboxes.forEach(_2121723 => {

        _2121723.addEventListener("change", () => {

          [...sauceCheckboxes]["filter"](_3960230 => _3960230.checked)["length"] >= 3 ? setInputsDisabled([...sauceCheckboxes]["filter"](_6200860 => !_6200860.checked), !0) : setInputsDisabled(sauceCheckboxes, !1);
        });
      });
    }), (document.querySelectorAll(".add-tacos-button")['forEach'](_6022972 => {

      _6022972.addEventListener("click", function(_4384275) {

        _4384275.preventDefault(), !async function(_3420952) {

          new bootstrap[("Modal")](document.getElementById("tacosAddModal"), {
            'keyboard': !1
          })["show"](), document.getElementById("selectProduct")["value"] = _3420952, _6928111.dispatchEvent(new Event('change', {
            'bubbles': !0,
            'cancelable': !0
          })), await fetchStockAvailability(), applyStockAvailability();
        }(this.getAttribute("data-tacos-type"));
      });
    }), setInputsDisabled(meatCheckboxes), setInputsDisabled(sauceCheckboxes), setInputsDisabled(garnishCheckboxes), $("#tacosAddModal")['on']("hidden.bs.modal", function() {

      resetTacoForm(), _6928111.value = 'null', setInputsDisabled(meatCheckboxes, !0), setInputsDisabled(sauceCheckboxes, !0), setInputsDisabled(garnishCheckboxes, !0);
    }));
  }), $('#tacosForm')["submit"](function(_6125221) {

    _6125221.preventDefault();
    const _2854133 = document.getElementById("selectProduct")["value"],
      _3013056 = document.querySelectorAll("input[name=\"viande[]\"]:checked"),
      _4415895 = document.querySelectorAll("input[name=\"sauce[]\"]:checked"),
      _3001469 = document.querySelectorAll("input[name=\"garniture[]\"]:checked");
    document.querySelector("input[name=\"viande[]\"][value=\"sans\"]:checked"), document.querySelector('input[name=\x22sauce[]\x22][value=\x22sans\x22]:checked'), document.querySelector("input[name=\"garniture[]\"][value=\"sans\"]:checked");
    if (0 === _3013056.length) return alert("Veuillez s\u00e9lectionner au moins une viande ou cocher \"sans viande\"."), !1;
    if (0 === _4415895.length) return alert("Veuillez s\u00e9lectionner au moins une sauce ou cocher \"sans sauce\"."), !1;
    if ("tacos_BOWL" !== _2854133 && 0 === _3001469.length) return alert('Veuillez\x20sélectionner\x20au\x20moins\x20une\x20garniture\x20ou\x20cocher\x20\x22sans\x20garniture\x22.'), !1;
    var _2276648 = getCsrfToken();
    const _8643420 = {};
    _3013056.forEach(_3465613 => {
      const _2628951 = _3465613.value,
        _1503096 = _3465613.closest(".meat-selection-row"),
        _4203143 = _1503096 ? _1503096.querySelector(".meat-quantity-input") : null,
        _1752037 = _4203143 && parseInt(_4203143.value, 10) || 1;
      _8643420[_2628951] = _1752037;
    });
    let _14895121 = $(this)['serialize']();
    Object.keys(_8643420)["forEach"](_2944964 => {

      _14895121 += "&meat_quantity[" + _2944964 + ']=' + _8643420[_2944964];
    }), $["ajax"]({
      'type': 'POST',
      'url': "ajax/owt.php",
      'headers': {
        'X-CSRF-Token': _2276648
      },
      'data': _14895121,
      'success': function(_3801159) {

        $("#products-list")["append"](_3801159), $("#product-messages")['empty'](), loadExistingTacos(), refreshTacoListUI(), refreshCartSummary();
      },
      'error': function() {
        alert('Error\x20on\x20submit.\x20Please\x20try\x20again.');
      }
    }), $("#tacosAddModal")["modal"]('hide'), resetTacoForm();
  }), $(document)['on']("click", ".delete-tacos", function(_3227763) {

    _3227763.preventDefault();
    var _2009102 = $(this)['attr']('data-index');
    if (confirm("\u00cates-vous s\u00fbr de vouloir supprimer ce produit\u00a0?")) {
      var _4842622 = getCsrfToken();
      $["ajax"]({
        'url': "ajax/dt.php",
        'headers': {
          'X-CSRF-Token': _4842622
        },
        'type': "POST",
        'data': {
          'index': _2009102
        },
        'success': function(_2152082) {

          $('#tacos-' + _2009102)["remove"](), refreshTacoListUI(), refreshCartSummary();
        },
        'error': function() {
          alert('Error\x20on\x20delete.\x20Please\x20try\x20again.');
        }
      });
    }
  }), $(document)["ready"](function() {
    loadExistingTacos();
  }), document.getElementById("orderForm")['addEventListener']("submit", function(_4042053) {

    _4042053.preventDefault();
    const _5183569 = document.getElementById('finalizeButton'),
      _4255311 = _5183569 ? _5183569.innerHTML : 'Finaliser\x20la\x20commande';
    if (document.getElementById("phone")['value'] !== document.getElementById("confirmPhone")['value']) return void alert("Les num\u00e9ros de t\u00e9l\u00e9phone ne correspondent pas, veuillez v\u00e9rifier !");
    _5183569 && (_5183569.disabled = !0, _5183569.innerHTML = "<span class=\"spinner-border spinner-border-sm me-2\"></span>Traitement en cours...", _5183569.classList["add"]("disabled"));
    const _3339720 = Date.now() + '_' + Math.random()['toString'](36)['substr'](2, 9),
      _3219489 = getCsrfToken();
    var _6079496 = new FormData(this);
    _6079496.append("transaction_id", _3339720), fetch("ajax/RocknRoll.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _3219489
      },
      'body': _6079496
    })["then"](_6028208 => {

      if (!_6028208.ok) {
        if (409 === _6028208.status) return _6028208.json()["then"](_5906034 => {
          throw new Error('DUPLICATE_ORDER');
        });
        if (403 === _6028208.status) return _6028208.text()['then'](_3394689 => {

          if (_3394689.includes('1\x20Order\x20per\x20minute') || _3394689.includes("Maximum")) throw new Error("RATE_LIMIT");
          throw new Error("FORBIDDEN");
        });
        throw new Error('RocknRoll\x20Network\x20response\x20was\x20not\x20ok');
      }
      return _6028208.json();
    })['then'](_2647563 => {

      if (!_2647563) throw console.error("Unexpected response structure:", _2647563), new Error("Error during order processing");
      {
        _5183569 && (_5183569.classList["remove"]("btn-danger"), _5183569.classList["add"]("btn-success"), _5183569.innerHTML = "<i class=\"fas fa-check me-2\"></i>Commande confirm\u00e9e!"), localStorage.removeItem("accordionState"), document.querySelectorAll(".collapse.show")["forEach"](_3536995 => {

          new bootstrap[("Collapse")](_3536995, {
            'toggle': !1
          })["hide"]();
        });
        var _1330354 = localStorage.getItem('order_stories');
        (_1330354 = _1330354 ? JSON.parse(_1330354) : [])['push'](_2647563), localStorage.setItem('order_stories', JSON.stringify(_1330354));
        let _3447885 = '';
        "livraison" === new URLSearchParams(window.location["search"])["get"]("content") ? _3447885 = '<div\x20class=\x22d-flex\x20justify-content-center\x20align-items-center\x22\x20style=\x22height:\x20100px;\x22><i\x20class=\x27fa\x20fa-check-circle\x27\x20style=\x27color:\x20green;\x20font-size:\x20100px;\x27></i></div><br\x20/>Votre\x20commande\x20a\x20été\x20reçue\x20et\x20sera\x20préparée.<br>Restez\x20joignable\x20s\x27il\x20vous\x20plaît.<br>Celui-ci\x20sera\x20mis\x20à\x20jour\x20lorsque\x20votre\x20commande\x20sera\x20en\x20route.' : "emporter" === new URLSearchParams(window.location["search"])["get"]("content") && (_3447885 = "<div class=\"d-flex justify-content-center align-items-center\" style=\"height: 100px;\"><i class='fa fa-check-circle' style='color: green; font-size: 100px; margin-right: 15px;'></i>Votre commande a \u00e9t\u00e9 re\u00e7ue et sera pr\u00e9par\u00e9e.</div>"), $("#orderModal")['on']("hidden.bs.modal", function() {

          $('#successModalBody')["html"](_3447885), $("#successModal")['modal']("show");
        })["modal"]("hide"), $('#successModal')['on']("hidden.bs.modal", function() {

          window.location.reload();
        }), gtag("event", 'purchase', {
          'transaction_id': _2647563.orderId,
          'affiliation': "Website",
          'value': _2647563.OrderData['price'],
          'currency': "CHF"
        });
      }
    })["catch"](_4629265 => {

      "undefined" != typeof isDevMode && isDevMode && (console.error("Error type:", _4629265.name), console.error('Error\x20message:', _4629265.message), console.error('Error\x20stack:', _4629265.stack)), _5183569 && ("DUPLICATE_ORDER" === _4629265.message ? (_5183569.classList.remove("btn-danger"), _5183569.classList["add"]('btn-info'), _5183569.innerHTML = "<i class=\"fas fa-info-circle me-2\"></i>Cette commande a d\u00e9j\u00e0 \u00e9t\u00e9 trait\u00e9e", setTimeout(() => {

        _5183569.disabled = !1, _5183569.classList['remove']('btn-info', "disabled"), _5183569.classList["add"]("btn-danger"), _5183569.innerHTML = _4255311;
      }, 3000)) : "RATE_LIMIT" === _4629265.message ? (_5183569.classList["remove"]('btn-danger'), _5183569.classList["add"]("btn-warning"), _5183569.innerHTML = '<i\x20class=\x22fas\x20fa-exclamation-triangle\x20me-2\x22></i>Veuillez\x20patienter\x201\x20minute', setTimeout(() => {

        _5183569.disabled = !1, _5183569.classList.remove('btn-warning', "disabled"), _5183569.classList.add("btn-danger"), _5183569.innerHTML = _4255311;
      }, 5000)) : _4629265.message["includes"]("Network") ? (_5183569.classList["add"]("btn-danger"), _5183569.innerHTML = "<i class=\"fas fa-wifi me-2\"></i>Erreur de connexion", setTimeout(() => {

        _5183569.disabled = !1, _5183569.classList["remove"]("disabled"), _5183569.innerHTML = _4255311;
      }, 3000)) : (_5183569.classList["add"]('btn-danger'), _5183569.innerHTML = "<i class=\"fas fa-times me-2\"></i>Erreur - Veuillez r\u00e9essayer", setTimeout(() => {

        _5183569.disabled = !1, _5183569.classList["remove"]('disabled'), _5183569.innerHTML = _4255311;
      }, 3000))), "RATE_LIMIT" === _4629265.message ? alert("Vous avez d\u00e9j\u00e0 pass\u00e9 une commande r\u00e9cemment. Veuillez patienter 1 minute avant de commander \u00e0 nouveau.") : "FORBIDDEN" === _4629265.message ? alert("Acc\u00e8s refus\u00e9. Veuillez r\u00e9essayer.") : _4629265.message["includes"]("Network") ? alert("Probl\u00e8me de connexion. V\u00e9rifiez votre connexion internet et r\u00e9essayez.") : alert("Une erreur est survenue lors de la soumission du formulaire. Veuillez r\u00e9essayer.");
    });
  }), document.addEventListener("DOMContentLoaded", function() {
    const _2130111 = document.getElementById("addToHomeText"),
      _1244769 = document.getElementById("bannerLogo"),
      _6530307 = navigator.userAgent["toLowerCase"]();

    function updateAddToHomePrompt(_5983123, _2376747) {
      _2130111.textContent = _5983123, _1244769.src = _2376747;
    }
    /iphone|ipad/ ["test"](_6530307) ? updateAddToHomePrompt("Appuyez sur l\u2019ic\u00f4ne de partage (en bas au centre) et s\u00e9lectionnez \u00ab Ajouter \u00e0 l\u2019\u00e9cran d\u2019accueil \u00bb.", './images/ios-share.png'): /android/ ['test'](_6530307) && updateAddToHomePrompt("Dans le menu du navigateur (en haut \u00e0 droite), s\u00e9lectionnez \u00ab Ajouter \u00e0 l\u2019\u00e9cran d\u2019accueil \u00bb.", "./images/android-share.png");
  });
  let maxMeatPortions = 1;

  function handleFreeSauceSelectionChange(_4556735) {
    const _5461540 = _4556735.target["closest"](".free-sauces-container");
    _5461540 && submitExtraSelectionWithSauces(_5461540.id["replace"]("free_sauce_select_", ''));
  }

  function submitExtraSelectionWithSauces(_4818973) {
    const _6969877 = document.getElementById(_4818973),
      _4219443 = _6969877.closest('.form-check')["querySelector"](".quantity-input"),
      _5350605 = parseInt(_4219443.value, 10),
      _2834943 = _6969877.getAttribute('value'),
      _3640555 = _6969877.closest('.form-check')["querySelector"](".extras-info")["textContent"],
      _4132495 = parseFloat(_3640555.replace("CHF ", '')) || 0.5,
      _5903691 = document.querySelectorAll("#free_sauce_select_" + _4818973 + " select"),
      _3834157 = [];
    _5903691.forEach(_5593578 => {

      if (_5593578.value) {
        const _6013764 = _5593578.options[_5593578.selectedIndex]['text'];
        _3834157.push({
          'id': _5593578.value,
          'name': _6013764,
          'price': 0
        });
      }
    }), submitExtraSelection(_4818973, _2834943, _4132495, _5350605, null, null, _3834157);
  }
  document.addEventListener("DOMContentLoaded", function() {
    const _4591531 = document.getElementById("selectProduct"),
      _4507035 = document.querySelectorAll("input[name=\"viande[]\"]"),
      _1342095 = document.querySelectorAll("input[name=\"sauce[]\"]"),
      _4462310 = document.querySelectorAll("input[name=\"garniture[]\"]");

    function enforceMeatQuantityLimits() {
      const _3328778 = [..._4507035]["filter"](_2337475 => _2337475.checked);
      let _3792886 = 0;
      1 === maxMeatPortions ? _3792886 = _3328778.length : _3328778.forEach(_5386943 => {
        const _4794482 = _5386943.closest(".meat-selection-row");
        if (_4794482) {
          const _6212539 = _4794482.querySelector(".meat-quantity-input"),
            _2524386 = parseInt(_6212539?.["value"] || 1);
          _3792886 += _2524386;
        }
      }), _4507035.forEach(_4698393 => {

        _4698393.checked || (_4698393.disabled = _3792886 >= maxMeatPortions);
      }), _3328778.forEach(_1265063 => {
        const _1621223 = _1265063.closest(".meat-selection-row");
        if (_1621223) {
          const _3063417 = _1621223.querySelector(".meat-quantity-input");
          if (_3063417) {
            const _2208944 = parseInt(_3063417.value),
              _3497315 = maxMeatPortions - _3792886 + _2208944;
            _3063417.max = Math.min(_3497315, 5), _2208944 > _3063417.max && (_3063417.value = _3063417.max);
          }
        }
      });
    }
    _4507035.forEach(_1302631 => {

      _1302631.addEventListener("change", function() {
        const _5662295 = this.closest('.meat-selection-row');
        if (_5662295) {
          const _5128772 = _5662295.querySelector(".meat-quantity-control");
          if (_5128772) {
            if (this.checked && maxMeatPortions > 1) _5128772.classList["remove"]('d-none'), enforceMeatQuantityLimits();
            else {
              _5128772.classList["add"]("d-none");
              const _8400322 = _5128772.querySelector(".meat-quantity-input");
              _8400322 && (_8400322.value = 1);
            }
          }
        }
        enforceMeatQuantityLimits();
      });
    }), document.querySelectorAll(".increase-meat")['forEach'](_3103067 => {

      _3103067.addEventListener('click', function() {
        const _1917109 = this.parentElement["querySelector"](".meat-quantity-input");
        if (_1917109) {
          const _3186115 = parseInt(_1917109.value) || 1;
          _3186115 < (parseInt(_1917109.max) || maxMeatPortions) && (_1917109.value = _3186115 + 1, enforceMeatQuantityLimits());
        }
      });
    }), document.querySelectorAll(".decrease-meat")["forEach"](_1393664 => {

      _1393664.addEventListener("click", function() {
        const _8996724 = this.parentElement["querySelector"](".meat-quantity-input");
        if (_8996724) {
          const _14188882 = parseInt(_8996724.value) || 1;
          _14188882 > 1 && (_8996724.value = _14188882 - 1, enforceMeatQuantityLimits());
        }
      });
    }), _1342095.forEach(_2996197 => {

      _2996197.addEventListener("change", function() {

        [..._1342095]['filter'](_4357644 => _4357644.checked)["length"] >= 3 ? [..._1342095]["filter"](_4046888 => !_4046888.checked)["forEach"](_2844035 => _2844035.disabled = !0) : _1342095.forEach(_3501110 => {

          _3501110.checked || (_3501110.disabled = !1);
        });
      });
    }), _4591531 && (_4591531.addEventListener('change', function() {
      const _4028114 = this.value;
      switch ([..._4507035, ..._1342095, ..._4462310]["forEach"](_2039249 => {

          _2039249.checked = !1, _2039249.disabled = !1;
        }), document.querySelectorAll(".meat-quantity-control")["forEach"](_1630997 => {

          _1630997.classList.add("d-none");
          const _4667796 = _1630997.querySelector('.meat-quantity-input');
          _4667796 && (_4667796.value = 1);
        }), _4028114) {
        case "tacos_L":
          maxMeatPortions = 1;
          break;
        case "tacos_BOWL":
          maxMeatPortions = 2;
          break;
        case "tacos_L_mixte":
        case 'tacos_XL':
          maxMeatPortions = 3;
          break;
        case 'tacos_XXL':
          maxMeatPortions = 4;
          break;
        case "tacos_GIGA":
          maxMeatPortions = 5;
          break;
        default:
          return maxMeatPortions = 0, void[..._4507035, ..._1342095, ..._4462310]["forEach"](_5102302 => _5102302.disabled = !0);
      } [..._4507035, ..._1342095, ..._4462310]["forEach"](_1573194 => _1573194.disabled = !1);
    }), [..._4507035, ..._1342095, ..._4462310]["forEach"](_3348401 => _3348401.disabled = !0)), $("#tacosAddModal")['on']("hidden.bs.modal", function() {

      _4591531 && (_4591531.value = "null", [..._4507035, ..._1342095, ..._4462310]["forEach"](_3238841 => {

        _3238841.checked = !1, _3238841.disabled = !0;
      }), document.querySelectorAll(".meat-quantity-control")['forEach'](_2881479 => {

        _2881479.classList["add"]("d-none");
        const _13842231 = _2881479.querySelector('.meat-quantity-input');
        _13842231 && (_13842231.value = 1);
      }), maxMeatPortions = 0);
    });
  }), document.addEventListener("DOMContentLoaded", function() {

    document.querySelectorAll("#tacosEditForm input[name=\"viande[]\"]")['forEach'](_4322318 => {

      _4322318.addEventListener("change", function() {
        const _2980856 = this.closest(".meat-selection-row");
        if (_2980856) {
          const _4958554 = _2980856.querySelector('.meat-quantity-control');
          if (_4958554) {
            let _4088754 = 1;
            switch (document.getElementById("editSelectProduct")["value"]) {
              case "tacos_L":
                _4088754 = 1;
                break;
              case "tacos_L_mixte":
              case "tacos_XL":
                _4088754 = 3;
                break;
              case "tacos_XXL":
                _4088754 = 4;
                break;
              case "tacos_GIGA":
                _4088754 = 5;
            }
            const _3582460 = _4958554.querySelector('.meat-quantity-input');
            this.checked && _4088754 > 1 ? (_4958554.classList["remove"]("d-none"), _3582460 && (_3582460.disabled = !1)) : (_4958554.classList["add"]("d-none"), _3582460 && (_3582460.value = 1, _3582460.disabled = !0));
          }
        }
      });
    }), document.querySelectorAll("#tacosEditForm .increase-meat")['forEach'](_5165765 => {

      _5165765.addEventListener("click", function() {
        const _3726235 = this.parentElement.querySelector(".meat-quantity-input");
        if (_3726235) {
          const _1146455 = parseInt(_3726235.value) || 1;
          _1146455 < (parseInt(_3726235.max) || 5) && (_3726235.value = _1146455 + 1);
        }
      });
    }), document.querySelectorAll("#tacosEditForm .decrease-meat")["forEach"](_4302412 => {

      _4302412.addEventListener("click", function() {
        const _4282008 = this.parentElement['querySelector'](".meat-quantity-input");
        if (_4282008) {
          const _4494431 = parseInt(_4282008.value) || 1;
          _4494431 > 1 && (_4282008.value = _4494431 - 1);
        }
      });
    });
  }), document.addEventListener('DOMContentLoaded', function() {

    try {
      if (!window.location["search"]['includes']("content=livraison")) return;
      const _4092632 = document.querySelector('select[name=\x22requestedFor\x22]'),
        _4515715 = document.getElementById("deliveryDemandWarning"),
        _3056176 = document.getElementById("demandMessage");
      if (_4092632 && _4515715 && _3056176) {
        let _4407521 = !1;
        _4092632.addEventListener("change", function() {
          const _7423318 = this.value;
          _7423318 && '' !== _7423318 ? updateDeliveryDemandBanner(_7423318) : _4515715.classList['add']('d-none');
        }), _4092632.value && '' !== _4092632.value && updateDeliveryDemandBanner(_4092632.value);
        const _6105121 = document.querySelector("#orderModal");
        _6105121 && _6105121.addEventListener('shown.bs.modal', function() {
          _4407521 || (!(function() {
            const _6029459 = document.querySelector("select[name=\"requestedFor\"]");
            if (!_6029459) return;
            const _1416472 = document.querySelector("input[name=\"csrf_token\"]")?.["value"] || '';
            fetch('ajax/check_delivery_demand.php', {
              'method': "POST",
              'headers': {
                'Content-Type': "application/json",
                'X-CSRF-TOKEN': _1416472
              },
              'body': JSON.stringify({
                'check_all': !0
              })
            })["then"](_1955099 => _1955099.json())["then"](_1126833 => {

              'success' === _1126833.status && _1126833.time_slots && _6029459.querySelectorAll("option[value]:not([value=\"\"])")['forEach'](_4148974 => {
                const _5315192 = _4148974.value,
                  _15213341 = [_5315192, _5315192 + ":00"];
                let _7728503 = !1;
                for (const _7388221 of _15213341)
                  if (_1126833.time_slots[_7388221] && _1126833.time_slots[_7388221]["is_high_demand"]) {
                    _7728503 = !0;
                    break;
                  } if (_7728503 && !_4148974.textContent["includes"]("Forte affluence")) {
                  const _1279817 = _4148974.textContent;
                  _4148974.textContent = _1279817 + " (Forte affluence)", _4148974.style.color = '#dc3545', _4148974.classList["add"]('high-demand');
                }
              });
            })["catch"](_4856414 => {

              console.error("Error checking all time slots:", _4856414);
            });
          }()), _4407521 = !0);
        });
      }

      function updateDeliveryDemandBanner(_11161623) {
        const _5698237 = document.querySelector("input[name=\"csrf_token\"]")?.['value'] || '';
        fetch("ajax/check_delivery_demand.php", {
          'method': "POST",
          'headers': {
            'Content-Type': "application/json",
            'X-CSRF-TOKEN': _5698237
          },
          'body': JSON.stringify({
            'time': _11161623
          })
        })["then"](function(_4781190) {

          return _4781190.json();
        })["then"](function(_4907603) {

          "success" === _4907603.status ? _4907603.is_high_demand ? (_3056176.textContent = _4907603.message, _4515715.classList.remove("d-none")) : _4515715.classList["add"]("d-none") : console.error("Delivery demand check error:", _4907603.message);
        })["catch"](function(_7640707) {

          console.error("Error:", _7640707);
        });
      }
    } catch (_5934625) {
      console.error("Delivery demand initialization error:", _5934625);
    }
  });
  let _6203567 = null,
    _2045528 = 0;
  const _5675222 = 30000;
  async function fetchStockAvailability() {
    const _4756369 = Date.now();
    if (_6203567 && _4756369 - _2045528 < _5675222) return _6203567;
    try {
      const _8699378 = await fetch("/office/stock_management.php?type=all");
      if (!_8699378.ok) throw new Error("Stock status fetch failed");
      const _2526135 = await _8699378.json();
      return _6203567 = _2526135, _2045528 = _4756369, _2526135;
    } catch (_1404761) {
      return console.error('Stock\x20status\x20fetch\x20error:', _1404761), null;
    }
  }

  function isStockAvailable(_12058058, _3748186) {

    if (!_6203567 || !_6203567[_12058058]) return !0;
    const _1570084 = _6203567[_12058058][_3748186];
    return !_1570084 || _1570084.in_stock;
  }

  function applyStockAvailability() {

    _6203567 && (document.querySelectorAll("input[name=\"viande\"], input[name=\"viande[]\"]")["forEach"](_5197195 => {
      const _5875919 = isStockAvailable("viandes", _5197195.value),
        _3888577 = _5197195.closest("label") || _5197195.parentElement,
        _14760805 = _5197195.closest(".meat-selection-row") || _5197195.closest('.form-check');
      if (_5875919) {
        if (_5197195.disabled = !1, _14760805 && (_14760805.style["opacity"] = '1', _14760805.style["pointerEvents"] = "auto"), _3888577) {
          const _11812765 = _3888577.querySelector(".out-of-stock-text");
          _11812765 && _11812765.remove();
        }
      } else {
        if (_5197195.disabled = !0, _5197195.checked = !1, _14760805 && (_14760805.style["opacity"] = "0.5", _14760805.style["pointerEvents"] = 'none'), _3888577) {
          if (!_3888577.querySelector(".out-of-stock-text")) {
            const _5858141 = document.createElement("span");
            _5858141.className = 'out-of-stock-text\x20text-danger\x20ms-2\x20fw-bold', _5858141.textContent = " (Temporairement \u00e9puis\u00e9)", _3888577.appendChild(_5858141);
          }
        }
      }
    }), document.querySelectorAll("input[name^=\"garniture\"]")["forEach"](_3092769 => {
      const _12512801 = isStockAvailable('garnitures', _3092769.value),
        _6237059 = _3092769.closest("label") || _3092769.parentElement["querySelector"]("label");
      if (_12512801) {
        if (_3092769.disabled = !1, _6237059) {
          const _2665508 = _6237059.querySelector(".out-of-stock-text");
          _2665508 && _2665508.remove();
        }
      } else {
        if (_3092769.disabled = !0, _6237059) {
          if (!_6237059.querySelector(".out-of-stock-text")) {
            const _3414219 = document.createElement("span");
            _3414219.className = "out-of-stock-text text-danger ms-2", _3414219.textContent = "(Temporairement \u00e9puis\u00e9)", _6237059.appendChild(_3414219);
          }
        }
      }
    }), document.querySelectorAll("input[name^=\"sauce\"]")["forEach"](_1977076 => {
      const _12322112 = isStockAvailable("sauces", _1977076.value),
        _3180877 = _1977076.closest("label") || _1977076.parentElement["querySelector"]("label");
      if (_12322112) {
        if (_1977076.disabled = !1, _3180877) {
          const _768285 = _3180877.querySelector(".out-of-stock-text");
          _768285 && _768285.remove();
        }
      } else {
        if (_1977076.disabled = !0, _3180877) {
          if (!_3180877.querySelector(".out-of-stock-text")) {
            const _2654346 = document.createElement("span");
            _2654346.className = 'out-of-stock-text\x20text-danger\x20ms-2', _2654346.textContent = "(Temporairement \u00e9puis\u00e9)", _3180877.appendChild(_2654346);
          }
        }
      }
    }), document.querySelectorAll('input[name=\x22dessert\x22]')['forEach'](_5466237 => {
      const _1129490 = isStockAvailable("desserts", _5466237.value),
        _3978110 = _5466237.closest("label") || _5466237.parentElement["querySelector"]("label");
      if (_1129490) {
        if (_5466237.disabled = !1, _3978110) {
          const _5689327 = _3978110.querySelector(".out-of-stock-text");
          _5689327 && _5689327.remove();
        }
      } else {
        if (_5466237.disabled = !0, _3978110) {
          if (!_3978110.querySelector('.out-of-stock-text')) {
            const _1662062 = document.createElement('span');
            _1662062.className = "out-of-stock-text text-danger ms-2", _1662062.textContent = "(Temporairement \u00e9puis\u00e9)", _3978110.appendChild(_1662062);
          }
        }
      }
    }), document.querySelectorAll("input[name=\"boisson\"]")["forEach"](_5002235 => {
      const _1160196 = isStockAvailable("boissons", _5002235.value),
        _2300368 = _5002235.closest("label") || _5002235.parentElement.querySelector("label");
      if (_1160196) {
        if (_5002235.disabled = !1, _2300368) {
          const _5681983 = _2300368.querySelector(".out-of-stock-text");
          _5681983 && _5681983.remove();
        }
      } else {
        if (_5002235.disabled = !0, _2300368) {
          if (!_2300368.querySelector('.out-of-stock-text')) {
            const _3385397 = document.createElement('span');
            _3385397.className = 'out-of-stock-text\x20text-danger\x20ms-2', _3385397.textContent = "(Temporairement \u00e9puis\u00e9)", _2300368.appendChild(_3385397);
          }
        }
      }
    }), document.querySelectorAll("input[name=\"extra[]\"]")['forEach'](_10505989 => {
      const _4795566 = isStockAvailable("extras", _10505989.value),
        _1537637 = _10505989.closest("label") || _10505989.parentElement.querySelector("label");
      if (_4795566) {
        if (_10505989.disabled = !1, _1537637) {
          const _5929593 = _1537637.querySelector('.out-of-stock-text');
          _5929593 && _5929593.remove();
        }
      } else {
        if (_10505989.disabled = !0, _1537637) {
          if (!_1537637.querySelector(".out-of-stock-text")) {
            const _16583551 = document.createElement("span");
            _16583551.className = "out-of-stock-text text-danger ms-2", _16583551.textContent = '(Temporairement\x20épuisé)', _1537637.appendChild(_16583551);
          }
        }
      }
    }));
  }
  document.addEventListener('DOMContentLoaded', async function() {
    await fetchStockAvailability(), applyStockAvailability();
  }), document.querySelectorAll('.modal')['forEach'](_4083458 => {

    _4083458.addEventListener("shown.bs.modal", async function() {
      await fetchStockAvailability(), applyStockAvailability();
    });
  }), (function() {
    const _538022 = document.getElementById("address"),
      _4534685 = document.getElementById("autocompleteDropdown");
    if (!_538022 || !_4534685) return;
    let _3772549, _3653971 = -1,
      _4407269 = [];

    function getPostalCodeFromSummary() {
      const _1899987 = document.querySelector('.col-4.mt-5.border.rounded\x20.text-center.mt-1.small');
      if (_1899987 && 'N/A' !== _1899987.textContent.trim()) {
        const _2539118 = _1899987.textContent.trim()['match'](/^(\d{4})/);
        return _2539118 ? _2539118[1] : null;
      }
      return null;
    }

    function setActiveAutocompleteItem(_2528888) {

      _4534685.querySelectorAll(".autocomplete-item")['forEach']((_4030418, _13965057) => {

        _4030418.classList["toggle"]("active", _13965057 === _2528888);
      }), _3653971 = _2528888;
    }

    function selectAutocompleteSuggestion(_5960606) {
      const _2334339 = _5960606.address?.["road"] || _5960606.address?.['pedestrian'] || '',
        _11764406 = _5960606.address?.["house_number"] || '',
        _1603517 = _538022.value["trim"]()['split'](/\s+/),
        _6091245 = _1603517[_1603517.length - 1],
        _7322574 = /^\d+$/ ["test"](_6091245);
      _538022.value = _11764406 ? _2334339 + '\x20' + _11764406 : _7322574 ? _2334339 + '\x20' + _6091245 : _2334339, _4534685.classList["remove"]("show"), setTimeout(() => {

        _538022.focus();
        const _3833729 = _538022.value["length"];
        _538022.setSelectionRange(_3833729, _3833729);
      }, 100);
    }
    _538022.addEventListener("input", function() {
      clearTimeout(_3772549), _3772549 = setTimeout(async () => {
        const _3271003 = _538022.value.trim(),
          _4516721 = getPostalCodeFromSummary();
        if (_3271003.length < 3) return void _4534685.classList["remove"]("show");
        if (!_4516721) return void _4534685.classList["remove"]("show");
        const _3979091 = await async function(_2416321, _4385409) {
          const _9989818 = _1388808;
          if (!_4385409 || _2416321[_9989818(823)] < 3) return [];
          const _1401742 = function(_3706067) {
              const _2055809 = _9989818,
                _2363565 = [{
                  'pattern': /\bchem\.\s*/gi,
                  'replacement': _2055809(470)
                }, {
                  'pattern': /\bch\.\s*/gi,
                  'replacement': _2055809(470)
                }, {
                  'pattern': /\bav\.\s*/gi,
                  'replacement': _2055809(459)
                }, {
                  'pattern': /\bbd\s+/gi,
                  'replacement': 'Boulevard\x20'
                }, {
                  'pattern': /\bpl\.\s*/gi,
                  'replacement': _2055809(629)
                }, {
                  'pattern': /\brte\s+/gi,
                  'replacement': _2055809(353)
                }, {
                  'pattern': /\br\.\s*/gi,
                  'replacement': 'Rue\x20'
                }];
              let _2817176 = _3706067;
              for (const {
                  pattern: _8493057,
                  replacement: _2720651
                }
                of _2363565) _2817176 = _2817176[_2055809(589)](_8493057, _2720651);
              return _2817176;
            }(_2416321),
            _1394117 = _9989818(831) + new URLSearchParams({
              'street': _1401742,
              'postalcode': _4385409,
              'country': _9989818(360),
              'format': 'json',
              'addressdetails': '1',
              'limit': '10',
              'layer': _9989818(737)
            })[_9989818(565)]();
          try {
            const _4563294 = await fetch(_1394117, {
              'headers': {
                'User-Agent': _9989818(613)
              }
            });
            return await _4563294[_9989818(656)]();
          } catch (_3951932) {
            return console[_9989818(694)]('Nominatim\x20error:', _3951932), [];
          }
        }(_3271003, _4516721);
        ! function(_4351184) {
          const _3934711 = getPostalCodeFromSummary(),
            _4157589 = new Map();
          _4351184.forEach(_1601089 => {
            const _5859867 = _1601089.address?.['road'] || _1601089.address?.["pedestrian"] || '',
              _5526654 = _1601089.address?.["postcode"] || '';
            _5859867 && !_4157589.has(_5859867) && (_1601089._isExactMatch = _5526654 === _3934711, _4157589.set(_5859867, _1601089));
          }), _4407269 = Array.from(_4157589.values())["sort"]((_6003580, _2454905) => _6003580._isExactMatch && !_2454905._isExactMatch ? -1 : !_6003580._isExactMatch && _2454905._isExactMatch ? 1 : 0), _3653971 = -1, 0 !== _4407269.length ? (_4534685.innerHTML = '', _4407269.forEach((_4475441, _2039606) => {
            const _4813994 = document.createElement('div');
            _4813994.className = "autocomplete-item", _4813994.dataset.index = _2039606;
            const _5082911 = _4475441.address?.['road'] || _4475441.address?.['pedestrian'] || '',
              _3107158 = _4475441.address?.["house_number"] || '',
              _5029560 = _3107158 ? _5082911 + '\x20' + _3107158 : _5082911;
            _4813994.innerHTML = "\n        <div class=\"street\">" + _5029560 + "</div>\n      ", _4813994.addEventListener("touchstart", _12076131 => {
              _12076131.preventDefault(), selectAutocompleteSuggestion(_4475441);
            }), _4813994.addEventListener("click", _4884713 => {

              _4884713.preventDefault(), selectAutocompleteSuggestion(_4475441);
            }), _4813994.addEventListener("mouseenter", () => setActiveAutocompleteItem(_2039606)), _4534685.appendChild(_4813994);
          }), _4534685.classList['add']('show')) : _4534685.classList['remove']("show");
        }(_3979091);
      }, 300);
    }), _538022.addEventListener("keydown", _1953012 => {
      const _5451072 = _4534685.querySelectorAll(".autocomplete-item");
      "ArrowDown" === _1953012.key ? (_1953012.preventDefault(), _3653971 = Math.min(_3653971 + 1, _5451072.length - 1), setActiveAutocompleteItem(_3653971)) : "ArrowUp" === _1953012.key ? (_1953012.preventDefault(), _3653971 = Math.max(_3653971 - 1, 0), setActiveAutocompleteItem(_3653971)) : 'Enter' === _1953012.key ? _3653971 >= 0 && _4407269[_3653971] && (_1953012.preventDefault(), selectAutocompleteSuggestion(_4407269[_3653971])) : "Escape" === _1953012.key && _4534685.classList["remove"]("show");
    }), document.addEventListener("click", _3984313 => {

      _4534685.contains(_3984313.target) || _3984313.target === _538022 || _4534685.classList["remove"]("show");
    });
  }());
})()));