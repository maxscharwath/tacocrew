(() => {


  function getCsrfToken() {

    return document["querySelector"]("input[name=\"csrf_token\"]")["value"];
  }
  var orderStatusRefreshIntervalId;
  window['addEventListener']("scroll", function() {

    var _0x1c226f = document['querySelector'](".whatsapp-icon");
    window["scrollY"] > 0x32 && (document["querySelector"](".header")["classList"]["add"]("shrink"), _0x1c226f['style']["display"] = 'block');
  }), $(document)["ready"](function() {

    $(".modal")['on']("hidden.bs.modal", function() {

      $(".modal-backdrop")["remove"](), $("body")["css"]({
        'overflow': '',
        'padding-right': ''
      });
    });
  }), document["querySelectorAll"]('.accordion-button')["forEach"](_0x743a72 => {

    _0x743a72["addEventListener"]("click", function() {
      const _0x55d89e = _0x743a72["classList"]['contains']("collapsed"),
        _0x4d7d8b = _0x743a72["querySelector"]("i.fas");
      (document["querySelectorAll"](".accordion-button i.fas")["forEach"](_0x60fe56 => {

        _0x60fe56["classList"]['remove']("fa-minus"), _0x60fe56["classList"]["add"]("fa-plus");
      }), _0x55d89e ? (_0x4d7d8b["classList"]["remove"]("fa-minus"), _0x4d7d8b["classList"]["add"]("fa-plus")) : (_0x4d7d8b["classList"]['remove']('fa-plus'), _0x4d7d8b["classList"]["add"]("fa-minus")), !_0x55d89e) && document["querySelector"](_0x743a72["dataset"]["bsTarget"])["addEventListener"]("shown.bs.collapse", function() {
        const _0x50cf97 = document["querySelector"](".header")["offsetHeight"],
          _0x18e104 = _0x743a72["getBoundingClientRect"]()["top"] + window["scrollY"] - _0x50cf97 - 0x14;
        window["scrollTo"]({
          'top': _0x18e104,
          'behavior': "smooth"
        });
      }, {
        'once': !0x0
      });
    });
  }), setInterval(function() {

    fetch("ajax/refresh_token.php", {
      'method': "GET",
      'credentials': "same-origin"
    })['then'](_0x312011 => {

      if (!_0x312011['ok']) throw 0x193 === _0x312011["status"] && console["log"]("REFRESH TOKEN ERROR"), new Error('REFRESH\x20TOKEN\x20Network\x20response\x20was\x20not\x20ok');
      return _0x312011['json']();
    })["then"](_0x16c997 => {

      _0x16c997["csrf_token"] && (document["querySelector"]("input[name=\"csrf_token\"]")["value"] = _0x16c997["csrf_token"]);
    })['catch'](_0x56c03d => console["error"]("Token yenileme hatas\u0131:", _0x56c03d));
  }, 0x1b7740), document["addEventListener"]("DOMContentLoaded", function() {
    refreshOrderHistory();
  });

  function refreshOrderHistory() {

    var _0x8db546 = document["getElementById"]("orderHistory"),
      _0x2f3d6c = JSON["parse"](localStorage['getItem']("order_stories") || '[]'),
      _0x7e2a0f = getCsrfToken();
    fetch("ajax/oh.php", {
      'method': "POST",
      'headers': {
        'Content-Type': "application/json",
        'X-CSRF-Token': _0x7e2a0f
      },
      'body': JSON["stringify"]({
        'orders': _0x2f3d6c["map"](_0x17e0c6 => ({
          'orderId': _0x17e0c6["orderId"]
        }))
      })
    })['then'](_0x302237 => {

      if (!_0x302237['ok']) throw 0x193 === _0x302237["status"] && window['location']["reload"](), new Error("OH Network response was not ok");
      return _0x302237["json"]();
    })["then"](_0x285fc8 => {

      Array['isArray'](_0x285fc8) || (_0x285fc8 = []);
      let _0x533c8e = !0x1;
      _0x285fc8["forEach"](_0x17fd88 => {
        const _0x540227 = _0x2f3d6c['findIndex'](_0x31f23e => _0x31f23e["orderId"] === _0x17fd88["orderId"]); - 0x1 !== _0x540227 && _0x2f3d6c[_0x540227]["OrderData"]["status"] !== _0x17fd88["status"] && (_0x2f3d6c[_0x540227]["OrderData"]["status"] = _0x17fd88["status"], _0x533c8e = !0x0);
      }), _0x8db546["innerHTML"] = '', _0x2f3d6c['sort']((_0x4e06b8, _0x135b23) => new Date(_0x135b23['OrderData']['date']) - new Date(_0x4e06b8["OrderData"]["date"])), _0x2f3d6c = _0x2f3d6c['slice'](0x0, 0x3);
      let _0x1bfb86 = !0x1;
      _0x2f3d6c["forEach"](_0xc6ac1d => {

        new Date(_0xc6ac1d["OrderData"]["date"])['toDateString']() === new Date()["toDateString"]() || 'pending' !== _0xc6ac1d["OrderData"]["status"] && "confirmed" !== _0xc6ac1d["OrderData"]["status"] && "ondelivery" !== _0xc6ac1d["OrderData"]['status'] ? "pending" !== _0xc6ac1d["OrderData"]["status"] && 'confirmed' !== _0xc6ac1d["OrderData"]["status"] && 'ondelivery' !== _0xc6ac1d["OrderData"]["status"] || (_0x1bfb86 = !0x0) : _0xc6ac1d['OrderData']["status"] = 'delivered';
        const _0x238232 = function(_0x3c1552) {
          const _0x326cac = _0x19773c,
            _0x36ab7d = function(_0x7355e) {
              const _0x229f65 = a0_0x43d4;
              let _0x709a68 = _0x229f65(0x150);
              return _0x709a68 += buildOrderItemsList(_0x7355e[_0x229f65(0x27d)], _0x229f65(0x278)), _0x709a68 += buildOrderItemsList(_0x7355e[_0x229f65(0x2b8)], 'Extras'), _0x709a68 += buildOrderItemsList(_0x7355e[_0x229f65(0x230)], _0x229f65(0x2da)), _0x709a68 += buildOrderItemsList(_0x7355e[_0x229f65(0x2d4)], 'Desserts'), _0x709a68 += '</ul>', _0x709a68;
            }(_0x3c1552),
            _0x4993d3 = document[_0x326cac(0x16d)](_0x326cac(0x26d));
          _0x4993d3['className'] = _0x326cac(0x31f) + getStatusVariant(_0x3c1552[_0x326cac(0x331)]['status']) + '\x20bg-light-subtle\x20border\x20border-' + getStatusVariant(_0x3c1552[_0x326cac(0x331)]['status']), _0x4993d3['setAttribute'](_0x326cac(0x2bf), _0x3c1552['orderId']);
          const _0x5e1d0e = new Date()[_0x326cac(0x241)](),
            _0x210b2b = new Date()[_0x326cac(0x32a)](),
            _0x55ac1c = new Date()['getDay'](),
            _0x1e76f6 = 0xa === _0x5e1d0e && _0x210b2b >= 0x0 || 0x5 === _0x55ac1c && 0x16 === _0x5e1d0e && _0x210b2b <= 0x32 || 0x0 === _0x55ac1c && 0x16 === _0x5e1d0e && _0x210b2b <= 0x32 || 0x5 !== _0x55ac1c && 0x0 !== _0x55ac1c && 0x15 === _0x5e1d0e && _0x210b2b <= 0x32 || _0x5e1d0e > 0xa && _0x5e1d0e < 0x15;
          let _0x377af6 = _0x326cac(0x202) !== _0x3c1552['OrderData'][_0x326cac(0x2a5)] && _0x326cac(0x216) !== _0x3c1552[_0x326cac(0x331)][_0x326cac(0x2a5)] && 'ondelivery' !== _0x3c1552[_0x326cac(0x331)]['status'] && _0x326cac(0x1e6) !== _0x3c1552[_0x326cac(0x331)]['status'];
          return _0x377af6 = _0x377af6 && _0x1e76f6, _0x4993d3[_0x326cac(0x27a)] = _0x326cac(0x247) + function(_0x1c066a, _0x5b09ce) {

            switch (_0x1c066a) {
              case _0x5fae2(0x202):
                return _0x5fae2(0x23e);
              case _0x5fae2(0x216):
                return _0x5fae2(0x259) === _0x5b09ce ? 'Confirmé\x20pour\x20retrait.' : 'Confirmé.';
              case _0x5fae2(0x318):
                return _0x5fae2(0x253);
              case _0x5fae2(0x1b2):
                return _0x5fae2(0x252);
              case _0x5fae2(0x1e6):
                return 'Annulé.';
              default:
                return _0x5fae2(0x1c2);
            }
          }(_0x3c1552[_0x326cac(0x331)]['status'], _0x3c1552[_0x326cac(0x331)][_0x326cac(0x2c0)]) + '\x0a' + (_0x377af6 ? _0x326cac(0x160) + _0x3c1552['orderId'] + _0x326cac(0x255) : _0x326cac(0x33c)) + _0x326cac(0x2c4) + (_0x326cac(0x202) === _0x3c1552[_0x326cac(0x331)]['status'] ? _0x326cac(0x344) + getStatusVariant(_0x3c1552[_0x326cac(0x331)][_0x326cac(0x2a5)]) + '-subtle\x20text-danger\x20rounded\x20opacity-75\x22>Votre\x20commande\x20est\x20en\x20cours\x20de\x20confirmation.\x20Les\x20commandes\x20passées\x20pendant\x20les\x20heures\x20ouvrables\x20sont\x20confirmées\x20en\x20quelques\x20secondes.</div>' : '') + '\x0a' + ('confirmed' === _0x3c1552[_0x326cac(0x331)][_0x326cac(0x2a5)] ? '<div\x20class=\x22p-2\x20mb-2\x20bg-' + getStatusVariant(_0x3c1552['OrderData'][_0x326cac(0x2a5)]) + _0x326cac(0x320) + function(_0x2c26a7) {

            return 'emporter' === _0x2c26a7 ? _0xb3d2d3(0x1ae) : _0xb3d2d3(0x179);
          }(_0x3c1552[_0x326cac(0x331)][_0x326cac(0x2c0)]) + '</div>' : '') + '\x0a' + (_0x326cac(0x318) === _0x3c1552['OrderData'][_0x326cac(0x2a5)] ? _0x326cac(0x344) + getStatusVariant(_0x3c1552['OrderData'][_0x326cac(0x2a5)]) + _0x326cac(0x228) : '') + '\x0a' + (_0x326cac(0x1e6) === _0x3c1552[_0x326cac(0x331)][_0x326cac(0x2a5)] ? _0x326cac(0x344) + getStatusVariant(_0x3c1552['OrderData'][_0x326cac(0x2a5)]) + _0x326cac(0x1ad) : '') + '\x0a<p\x20class=\x27card-title\x20text-end\x27>Date\x20de\x20commande:\x20' + _0x3c1552[_0x326cac(0x331)]['date'] + _0x326cac(0x220) + (_0x326cac(0x259) === _0x3c1552[_0x326cac(0x331)][_0x326cac(0x2c0)] ? _0x326cac(0x28f) : _0x326cac(0x23c)) + _0x326cac(0x30c) + (_0x3c1552[_0x326cac(0x331)]['requestedFor'] ? _0x326cac(0x282) + _0x3c1552[_0x326cac(0x331)][_0x326cac(0x30a)] + _0x326cac(0x301) : '') + '\x0a' + _0x36ab7d + '\x0a' + (_0x326cac(0x162) === _0x3c1552['OrderData'][_0x326cac(0x2c0)] ? '<p\x20class=\x27card-subtitle\x20text-end\x20text-muted\x27>Frais\x20de\x20livraison:\x202.00\x20CHF</p>' : '') + _0x326cac(0x188) + _0x3c1552[_0x326cac(0x331)]['price'] + '\x20CHF</p>\x0a' + ('emporter' === _0x3c1552[_0x326cac(0x331)][_0x326cac(0x2c0)] && _0x326cac(0x1b2) !== _0x3c1552[_0x326cac(0x331)][_0x326cac(0x2a5)] ? _0x326cac(0x280) : '') + '\x0a</div>\x0a', _0x4993d3;
        }(_0xc6ac1d);
        _0x8db546["appendChild"](_0x238232);
      }), _0x1bfb86 && !orderStatusRefreshIntervalId ? orderStatusRefreshIntervalId = setInterval(refreshOrderHistory, 0x3a98) : !_0x1bfb86 && orderStatusRefreshIntervalId && (clearInterval(orderStatusRefreshIntervalId), orderStatusRefreshIntervalId = null), localStorage["setItem"]("order_stories", JSON['stringify'](_0x2f3d6c)), _0x2f3d6c;
    })["catch"](_0x457009 => {

      console["error"]("Fetch Error:", _0x457009);
    });
  }

  function buildOrderItemsList(items, sectionLabel) {

    let renderedItems = '';
    "object" != typeof items || null === items || Array["isArray"](items) || (items = Object['values'](items));
    return Array["isArray"](items) && items["forEach"](item => {

      let extraDetails = '';
      switch (sectionLabel) {
        case 'Tacos':
          extraDetails = "<br><strong>- Viande(s):</strong> <em>" + item["viande"]["map"](meat => {
            const quantityLabel = meat['quantity'] && meat["quantity"] > 0x1 ? '\x20x' + meat["quantity"] : '';
            return meat["name"] + quantityLabel;
          })["join"](',\x20') + '\x20</em>\x20<br>-\x20<strong>Garnitures:</strong><em>\x20' + item["garniture"]["map"](garnish => garnish["name"])["join"](',\x20') + '\x20</em>\x20<br>-\x20<strong>Sauces:</strong><em>\x20' + item["sauce"]["map"](sauce => sauce["name"])['join'](',\x20') + " </em>", item["tacosNote"] && (extraDetails += '<br>-\x20<strong>Remarque:</strong>\x20<em>' + item["tacosNote"] + "</em>");
          break;
        case 'Extras':
          let freeSauceDetails = '';
          if (item['free_sauces'] && Array["isArray"](item['free_sauces']) && item["free_sauces"]["length"] > 0x0) {
            const sauceNames = item["free_sauces"]['filter'](sauce => sauce["name"])["map"](sauce => sauce["name"]);
            sauceNames["length"] > 0x0 && (freeSauceDetails = "<br>- <strong>Sauces offertes:</strong> <em>" + sauceNames['join'](',\x20') + "</em>");
          } else item["free_sauce"] && item["free_sauce"]["name"] && (freeSauceDetails = "<br>- <strong>Sauce offerte:</strong> <em>" + item['free_sauce']["name"] + "</em>");
          extraDetails = freeSauceDetails;
          break;
        default:
          extraDetails = '';
      }
      renderedItems += "<li class='list-group-item'>\n  <span class=\"border rounded py-1 px-2\">" + item["quantity"] + "</span> x " + item["name"] + '\x20-\x20' + item["price"] + '\x20CHF\x20' + extraDetails + "\n  </li>";
    }), renderedItems;
  }

  function getStatusVariant(_0x1ee734) {

    switch (_0x1ee734) {
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
  window["repeatOrder"] = function(_0x4c0389) {
    const _0x46a4f7 = JSON["parse"](localStorage['getItem']("order_stories"))['find'](_0x319017 => _0x319017["orderId"] == _0x4c0389);
    if (!_0x46a4f7) return void alert("Order not found.");
    const _0x19aba6 = getCsrfToken(),
      _0x2a5f05 = document["querySelector"]("button[onclick='repeatOrder(" + _0x4c0389 + ")']");
    _0x2a5f05["disabled"] = !0x0, fetch('ajax/restore_order.php', {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _0x19aba6
      },
      'body': JSON["stringify"]({
        'order': _0x46a4f7
      })
    })["then"](_0x12f637 => {

      if (!_0x12f637['ok']) throw 0x193 === _0x12f637["status"] && alert("RESTORE ORDER REFRESH"), new Error("RESTORE ORDER Network response was not ok");
      return _0x12f637['json']();
    })["then"](_0x4a7f29 => {

      if ("success" === _0x4a7f29['status'] || 'warning' === _0x4a7f29["status"]) {
        const _0x4bad2f = new bootstrap['Modal'](document["getElementById"]("successModal")),
          _0x12c329 = document["getElementById"]('successModalBody');
        if ("warning" === _0x4a7f29['status']) {
          let _0x5dd7f8 = '';
          _0x4a7f29["out_of_stock_items"] && _0x4a7f29['out_of_stock_items']["length"] > 0x0 && (_0x5dd7f8 = '<div\x20class=\x22alert\x20alert-warning\x20text-start\x20mx-auto\x22\x20style=\x22max-width:\x20500px;\x20background-color:\x20#fff3cd;\x20border-left:\x204px\x20solid\x20#ffc107;\x22><ul\x20style=\x22list-style:\x20none;\x20padding-left:\x200;\x20margin-bottom:\x200;\x22>', _0x4a7f29['out_of_stock_items']["forEach"](function(_0xb2dbd0) {

            _0x5dd7f8 += '<li\x20style=\x22padding:\x208px\x200;\x20border-bottom:\x201px\x20solid\x20#ffeaa7;\x22><i\x20class=\x22fa\x20fa-times-circle\x20text-danger\x20me-2\x22></i><strong>' + _0xb2dbd0 + "</strong></li>";
          }), _0x5dd7f8 += "</ul></div>"), _0x12c329["innerHTML"] = '<div\x20class=\x22text-center\x22\x20style=\x22padding:\x2020px;\x22><div\x20class=\x22d-flex\x20justify-content-center\x20align-items-center\x20mb-4\x22\x20style=\x22height:\x20100px;\x22><div\x20style=\x22width:\x20100px;\x20height:\x20100px;\x20border-radius:\x2050%;\x20background:\x20linear-gradient(135deg,\x20#ffeaa7\x200%,\x20#fdcb6e\x20100%);\x20display:\x20flex;\x20align-items:\x20center;\x20justify-content:\x20center;\x20box-shadow:\x200\x204px\x2015px\x20rgba(253,\x20203,\x20110,\x200.4);\x22><i\x20class=\x22fa\x20fa-exclamation-triangle\x22\x20style=\x22color:\x20#fff;\x20font-size:\x2050px;\x22></i></div></div><h4\x20class=\x22mb-3\x22\x20style=\x22color:\x20#e17055;\x20font-weight:\x20600;\x22>Certains\x20produits\x20ne\x20sont\x20pas\x20disponibles</h4><p\x20class=\x22mb-4\x22\x20style=\x22color:\x20#636e72;\x20font-size:\x2015px;\x22>Les\x20produits\x20suivants\x20ne\x20sont\x20temporairement\x20pas\x20disponibles\x20et\x20n\x27ont\x20pas\x20été\x20ajoutés\x20à\x20votre\x20panier:</p>' + _0x5dd7f8 + "<div class=\"alert alert-success mx-auto mt-4\" style=\"max-width: 500px; background-color: #d4edda; border-left: 4px solid #28a745;\"><i class=\"fa fa-check-circle text-success me-2\"></i>Les autres produits ont \u00e9t\u00e9 ajout\u00e9s avec succ\u00e8s.</div><button id=\"continueButton\" class=\"btn btn-danger mt-3\" style=\"min-width: 200px; padding: 12px 24px; font-size: 16px; border-radius: 25px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);\">Continuer vers le panier</button></div>", _0x4bad2f["show"](), document["getElementById"]("continueButton")["addEventListener"]("click", function() {

            _0x4bad2f["hide"](), localStorage["setItem"]("openOrderModal", "true"), window["location"]["reload"]();
          });
        } else {
          _0x12c329['innerHTML'] = "\n            <div class=\"d-flex justify-content-center align-items-center\" style=\"height: 100px;\">\n              <i class=\"fa fa-check-circle\" style=\"color: green; font-size: 50px;\"></i>\n            </div>\n            Les produits sont \u00e0 nouveau ajout\u00e9s \u00e0 votre panier. <br />\n            La page sera actualis\u00e9e dans <span id=\"countdown\">3</span> secondes.\n          ", _0x4bad2f["show"]();
          let _0x335b7a = 0x3;
          const _0x393272 = document['getElementById']('countdown'),
            _0x2744f3 = setInterval(() => {
              const _0x2f80b6 = _0x305fa2;
              _0x335b7a--, _0x393272[_0x2f80b6(0x1b8)] = _0x335b7a, 0x0 === _0x335b7a && (clearInterval(_0x2744f3), _0x4bad2f['hide'](), localStorage[_0x2f80b6(0x281)]('openOrderModal', _0x2f80b6(0x251)), window[_0x2f80b6(0x186)][_0x2f80b6(0x27b)]());
            }, 0x3e8);
        }
      } else alert("Error during repeat order. Please try again later."), _0x2a5f05["disabled"] = !0x1;
    })["catch"](_0x5ea52e => {

      console['error']('Error:', _0x5ea52e), alert("Error during repeat order. Please try again later."), _0x2a5f05["disabled"] = !0x1;
    });
  }, document['addEventListener']("DOMContentLoaded", function() {

    if ("true" === localStorage["getItem"]('openOrderModal')) {
      localStorage["removeItem"]('openOrderModal'), new bootstrap[("Modal")](document["getElementById"]('orderModal'))["show"]();
      var _0x256d78 = getCsrfToken();
      fetch("ajax/os.php", {
        'method': "POST",
        'headers': {
          'Content-Type': "application/x-www-form-urlencoded"
        },
        'body': 'csrf_token=' + encodeURIComponent(_0x256d78)
      })["then"](_0x5ae98f => {

        if (!_0x5ae98f['ok']) throw 0x193 === _0x5ae98f["status"] && console["log"]("OS REFRESH"), new Error("Network response was not ok");
        return _0x5ae98f["text"]();
      })["then"](_0x47e711 => {

        document["querySelector"]("#orderModal .order-summary")["innerHTML"] = _0x47e711;
      })['catch'](_0x1981d3 => console["error"]("Error loading the order summary:", _0x1981d3));
    }
  }), document["querySelectorAll"](".accordion-button")["forEach"](_0x227261 => {

    _0x227261["addEventListener"]("click", function() {
      const _0x176c22 = this['dataset']["bsTarget"],
        _0x52bd76 = {
          'activeSection': this["classList"]["contains"]("collapsed") ? null : _0x176c22,
          'timestamp': new Date()["getTime"]()
        };
      localStorage["setItem"]("accordionState", JSON['stringify'](_0x52bd76));
    });
  }), document["addEventListener"]('DOMContentLoaded', function() {
    const _0x45f0a7 = localStorage['getItem']("accordionState");
    if (_0x45f0a7) {
      const {
        activeSection: _0x164a25,
        timestamp: _0x3d64d9
      } = JSON['parse'](_0x45f0a7);
      if (new Date()["getTime"]() - _0x3d64d9 < 0x36ee80 && _0x164a25) {
        const _0x84168f = document["querySelector"](_0x164a25);
        _0x84168f && new bootstrap['Collapse'](_0x84168f, {
          'toggle': !0x1
        })["show"]();
      } else localStorage["removeItem"]("accordionState");
    }
  }), document["addEventListener"]("DOMContentLoaded", function() {

    document["body"]["addEventListener"]("click", function(_0x1ac9d0) {

      _0x1ac9d0["target"]["matches"](".increase-quantity") && sendTacoQuantityUpdate('increaseQuantity', _0x1ac9d0["target"]["dataset"]["index"]), _0x1ac9d0["target"]["matches"](".decrease-quantity") && sendTacoQuantityUpdate('decreaseQuantity', _0x1ac9d0["target"]["dataset"]["index"]);
    });
  });
  var meatCheckboxes, sauceCheckboxes, garnishCheckboxes, tacoQuantityCsrfToken = getCsrfToken();

  function sendTacoQuantityUpdate(action, tacoIndex) {

    const request = new XMLHttpRequest();
    request["open"]("POST", "ajax/owt.php", !0x0);
    request["setRequestHeader"]("Content-Type", "application/x-www-form-urlencoded");
    request['setRequestHeader']('X-CSRF-Token', tacoQuantityCsrfToken);
    request["onload"] = function() {

      if (0xc8 === request['status']) {
        refreshTacoListUI();
        const response = JSON["parse"](this["responseText"]);
        if ("success" === response["status"]) {
          const quantityInput = document["querySelector"]("#tacos-" + tacoIndex + '\x20.quantity-input');
          quantityInput ? (quantityInput["value"] = response["quantity"], refreshCartSummary()) : console['error']("Quantity input not found for index: " + tacoIndex);
        } else alert("Error during processing.");
      } else console["error"]("Request failed with status " + request['status'] + ':\x20' + request["statusText"]);
    };
    request["send"]("action=" + action + '&index=' + tacoIndex);
  }

  function applyEditSelectionLimits(selectedTacoSize) {

    [...meatCheckboxes, ...sauceCheckboxes]["forEach"](input => input["disabled"] = !0x1);
    let maxAllowedMeats = 0x0;
    switch (selectedTacoSize) {
      case "tacos_L":
        maxAllowedMeats = 0x1;
        break;
      case "tacos_BOWL":
        maxAllowedMeats = 0x2;
        break;
      case 'tacos_L_mixte':
      case "tacos_XL":
        maxAllowedMeats = 0x3;
        break;
      case "tacos_XXL":
        maxAllowedMeats = 0x4;
        break;
      case "tacos_GIGA":
        maxAllowedMeats = 0x5;
        break;
      default:
        [...meatCheckboxes, ...sauceCheckboxes]["forEach"](input => input["disabled"] = !0x0);
        return;
    }
    (function(meatLimit) {

      let currentlySelectedMeats = [...meatCheckboxes]["filter"](checkbox => checkbox["checked"])["length"];
      meatCheckboxes['forEach'](checkbox => {

        checkbox["disabled"] = currentlySelectedMeats >= meatLimit && !checkbox["checked"];
      }), meatCheckboxes["forEach"](checkbox => {
        checkbox['addEventListener']('change', () => {

          let updatedSelectedMeats = [...meatCheckboxes]["filter"](meatInput => meatInput['checked'])["length"];
          meatCheckboxes["forEach"](meatInput => {

            meatInput["disabled"] = updatedSelectedMeats >= meatLimit && !meatInput["checked"];
          });
        });
      });
    })(maxAllowedMeats),
    function(sauceLimit) {

      let selectedSauceCount = [...sauceCheckboxes]["filter"](checkbox => checkbox["checked"])["length"];
      sauceCheckboxes['forEach'](checkbox => {

        checkbox["disabled"] = selectedSauceCount >= sauceLimit && !checkbox['checked'];
      }), sauceCheckboxes["forEach"](checkbox => {

        checkbox["addEventListener"]('change', () => {

          let updatedSauceCount = [...sauceCheckboxes]["filter"](sauceInput => sauceInput["checked"])["length"];
          sauceCheckboxes["forEach"](sauceInput => {

            sauceInput["disabled"] = updatedSauceCount >= sauceLimit && !sauceInput["checked"];
          });
        });
      });
    }(0x3);
  }

  function submitExtraSelection(_0x5c8afd, _0x6f4a63, _0x3dd0cd, _0x48be50, _0x56ce49 = null, _0x47d502 = '', _0x4c04dd = null) {

    var _0x44207a = getCsrfToken();
    const _0x349927 = {
      'id': _0x5c8afd,
      'name': _0x6f4a63,
      'price': _0x3dd0cd,
      'quantity': _0x48be50,
      'free_sauce': _0x56ce49 ? {
        'id': _0x56ce49,
        'name': _0x47d502,
        'price': 0x0
      } : void 0x0,
      'free_sauces': _0x4c04dd
    };
    fetch("ajax/ues.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _0x44207a
      },
      'body': JSON["stringify"](_0x349927)
    })["then"](_0x597efc => _0x597efc["json"]())["then"](_0x167028 => {
      refreshCartSummary();
    })["catch"](_0x3a4f57 => console["error"]("Error:", _0x3a4f57));
  }

  function refreshCategoryBadges() {

    const csrfToken = getCsrfToken();
    fetch("ajax/sd.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': csrfToken
      }
    })["then"](response => {

      if (!response['ok']) throw 0x193 === response["status"] && console["log"]('SD\x20REFRESH'), new Error('Network\x20response\x20was\x20not\x20ok');
      return response["json"]();
    })["then"](categorySummary => {

      Object["entries"](categorySummary)["forEach"](([categoryKey, summary]) => {
        const totalQuantity = summary["totalQuantity"],
          totalPrice = summary["totalPrice"];
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
            console["error"]("Unknown category:", categoryKey);
            return;
        }
        const badge = document['querySelector']('#' + sectionId + " .accordion-button .badge");
        if (badge) {
          if (totalQuantity > 0x0) {
            const productLabel = totalQuantity > 0x1 ? "produits" : "produit";
            badge["textContent"] = totalQuantity + '\x20' + productLabel + " total " + totalPrice + "CHF", badge["style"]["display"] = '';
          } else badge['style']["display"] = "none";
        }
      });
    })["catch"](error => console["error"]("Error:", error));
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

      if (!response['ok']) throw 0x193 === response["status"] && console['log']("CS REFRESH"), new Error("CS Network response was not ok");
      return response["json"]();
    })["then"](payload => {

      document['getElementById']("cart-summary")["innerHTML"] = payload["message"], refreshCategoryBadges();
    })["catch"](error => console["error"]("Hata:", error));
  }

  function toggleTacoOptionsBySize(_0x48bdee, _0x388049) {

    var _0x40cb0f = ["viande_hachee", "escalope_de_poulet", 'merguez', "soudjouk", "falafel_vegetarien", "sans_viande"],
      _0xe84a35 = ["cordon_bleu", "nuggets", "tenders", "kebab_agneau"],
      _0x517c75 = ['cheddar', "gruyere", "frites"];
    'tacos_BOWL' === _0x48bdee ? (_0x40cb0f['concat'](_0xe84a35)['forEach'](function(_0x453bc0) {
      const _0x1339d1 = document["querySelector"]("input[name=\"viande[]\"][value=\"" + _0x453bc0 + '\x22]');
      _0x1339d1 && !_0x1339d1["checked"] && (_0x1339d1["disabled"] = !0x1);
    }), _0x40cb0f["concat"](_0xe84a35)["forEach"](function(_0x5df07b) {

      document["getElementById"](_0x388049 + _0x5df07b + "_div")['style']["display"] = "block";
    }), _0x517c75["forEach"](function(_0x26f514) {

      document["getElementById"](_0x388049 + _0x26f514 + '_div')['style']["display"] = 'none';
    }), document["getElementById"](_0x388049 + "frites_note")["style"]["display"] = "block") : (_0x40cb0f["concat"](_0xe84a35)["forEach"](function(_0x14a28a) {

      document['getElementById'](_0x388049 + _0x14a28a + "_div")["style"]["display"] = "block";
    }), _0x517c75["forEach"](function(_0x2da752) {

      document["getElementById"](_0x388049 + _0x2da752 + "_div")["style"]["display"] = "block";
    }), document['getElementById'](_0x388049 + "frites_note")["style"]['display'] = 'none');
  }

  function resetTacoForm() {

    document['getElementById']('tacosForm')["reset"](), [...meatCheckboxes, ...sauceCheckboxes, ...garnishCheckboxes]["forEach"](_0x4853ba => {

      _0x4853ba["checked"] = !0x1, _0x4853ba["disabled"] = !0x1;
    });
  }

  function refreshTacoListUI() {

    0x0 === $("#products-list")["children"]()["length"] ? ($('#product-messages')["html"]("<p class=\"fst-italic\">Veuillez commencer par choisir la taille de vos tacos.</p>"), $("div:contains(\"Tacos dans votre panier\")")['remove']()) : $("#product-messages")["html"]('<div\x20class=\x22bg-danger\x20rounded\x20text-light\x20p-2\x22\x20role=\x22alert\x22><i\x20class=\x22fa-solid\x20fa-chevron-down\x22></i>\x20Tacos\x20dans\x20votre\x20panier</div>'), $("#products-list .card")["each"](function(_0x159822) {

      $(this)["attr"]('id', 'tacos-' + _0x159822), $(this)['attr']("data-index", _0x159822), $(this)["find"](".delete-tacos")["attr"]("data-index", _0x159822);
    });
  }

  function loadExistingTacos() {

    var _0x239238 = getCsrfToken();
    $["ajax"]({
      'type': "POST",
      'url': "ajax/owt.php",
      'headers': {
        'X-CSRF-Token': _0x239238
      },
      'data': {
        'loadProducts': !0x0
      },
      'success': function(_0x3e6ff8) {

        $("#products-list")['html'](_0x3e6ff8), refreshTacoListUI(), refreshCartSummary();
      },
      'error': function() {

        location["reload"]();
      }
    });
  }
  document["addEventListener"]("DOMContentLoaded", function() {

    document["getElementById"]("orderAccordion")["addEventListener"]("click", function(_0x2201a4) {
      const _0xd0620c = _0x2201a4["target"]["closest"]('.edit-tacos');
      if (_0xd0620c) {
        _0x2201a4["preventDefault"]();
        const _0x3ea2d6 = _0xd0620c["getAttribute"]('data-index'),
          _0x290c87 = getCsrfToken();
        document["getElementById"]('editIndex')["value"] = _0x3ea2d6, fetch("ajax/gtd.php", {
          'method': "POST",
          'headers': {
            'X-CSRF-Token': _0x290c87,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          'body': "index=" + _0x3ea2d6
        })["then"](_0x49574f => {

          if (!_0x49574f['ok']) throw 0x193 === _0x49574f["status"] && console["log"]("GTD REFRESH"), new Error("GTD Network response was not ok");
          return _0x49574f["json"]();
        })["then"](_0x32a4f1 => {

          if ("success" === _0x32a4f1["status"]) {
            const {
              taille: _0x17960c,
              viande: _0xf20883,
              garniture: _0x5a3a4d,
              sauce: _0x128092,
              tacosNote: _0x49431e
            } = _0x32a4f1["data"];
            console["log"]('Loaded\x20tacos\x20data:', _0x32a4f1["data"]), console["log"]("Viande data:", _0xf20883), document['getElementById']("editSelectProduct")['value'] = _0x17960c, document['getElementById']("editTaille")['value'] = _0x17960c, document["getElementById"]("editTacosNote")["value"] = _0x49431e, document["querySelectorAll"]("#tacosEditForm input[type=\"checkbox\"]")['forEach'](_0x5342e4 => {

                _0x5342e4["checked"] = !0x1;
              }),
              function(_0x5240e1, _0x2c8c27, _0xd03c5c, _0x3f59da) {

                document['querySelectorAll']("#tacosEditForm input[type=\"checkbox\"]")["forEach"](_0x4d1b11 => {

                  _0x4d1b11['checked'] = !0x1, _0x4d1b11["disabled"] = !0x1;
                }), document["querySelectorAll"]("#tacosEditForm .meat-quantity-control")["forEach"](_0x21eefc => {

                  _0x21eefc['classList']["add"]("d-none");
                  const _0x4038c2 = _0x21eefc["querySelector"]('.meat-quantity-input');
                  _0x4038c2 && (_0x4038c2["value"] = 0x1, _0x4038c2["disabled"] = !0x0);
                });
                let _0x54deb5 = 0x1;
                switch (_0x3f59da) {
                  case "tacos_L":
                    _0x54deb5 = 0x1;
                    break;
                  case "tacos_L_mixte":
                  case "tacos_XL":
                    _0x54deb5 = 0x3;
                    break;
                  case 'tacos_XXL':
                    _0x54deb5 = 0x4;
                    break;
                  case "tacos_GIGA":
                    _0x54deb5 = 0x5;
                }
                _0x5240e1["forEach"](_0xe764fa => {
                  const _0x2af82f = document["querySelector"]('#tacosEditForm\x20input[name=\x22viande[]\x22][value=\x22' + _0xe764fa["slug"] + '\x22]');
                  if (_0x2af82f && (_0x2af82f["checked"] = !0x0, _0x54deb5 > 0x1)) {
                    const _0x1b776e = _0x2af82f["closest"](".meat-selection-row");
                    if (_0x1b776e) {
                      const _0x568555 = _0x1b776e['querySelector'](".meat-quantity-control"),
                        _0x389096 = _0x1b776e['querySelector'](".meat-quantity-input");
                      _0x568555 && _0x389096 && (_0x568555["classList"]['remove']("d-none"), _0x389096["value"] = _0xe764fa["quantity"] || 0x1, _0x389096["disabled"] = !0x1);
                    }
                  }
                }), _0x2c8c27["forEach"](_0x122bf2 => {
                  const _0x49b28c = document['querySelector']("#tacosEditForm input[name=\"garniture[]\"][value=\"" + _0x122bf2["slug"] + '\x22]');
                  _0x49b28c && (_0x49b28c["checked"] = !0x0);
                }), _0xd03c5c["forEach"](_0x4de63d => {
                  const _0x2f3350 = document["querySelector"]('#tacosEditForm\x20input[name=\x22sauce[]\x22][value=\x22' + _0x4de63d["slug"] + '\x22]');
                  _0x2f3350 && (_0x2f3350["checked"] = !0x0);
                }), applyEditSelectionLimits(_0x3f59da);
              }(_0xf20883, _0x5a3a4d, _0x128092, _0x17960c), new bootstrap[("Modal")](document['getElementById']("tacosEditModal"))['show']();
          } else console['error']("Failed to fetch tacos details:", _0x32a4f1["message"]), console["log"]("Connection error. Please refresh the page.");
        })['catch'](_0x452342 => console["error"]('Error:', _0x452342));
      }
    });
  }), document["addEventListener"]("DOMContentLoaded", function() {

    document['getElementById']('tacosEditForm')["addEventListener"]('submit', function(_0x3eff30) {

      _0x3eff30['preventDefault']();
      const _0x2d852e = document["getElementById"]("editSelectProduct")['value'],
        _0x58a803 = document["querySelectorAll"]("#tacosEditForm input[name=\"viande[]\"]:checked"),
        _0x414cb3 = document["querySelectorAll"]("#tacosEditForm input[name=\"sauce[]\"]:checked"),
        _0x1cb967 = document["querySelectorAll"]("#tacosEditForm input[name=\"garniture[]\"]:checked");
      if (0x0 === _0x58a803['length']) return alert("Veuillez s\u00e9lectionner au moins une viande ou cocher \"sans viande\"."), !0x1;
      if (0x0 === _0x414cb3["length"]) return alert("Veuillez s\u00e9lectionner au moins une sauce ou cocher \"sans sauce\"."), !0x1;
      if ("tacos_BOWL" !== _0x2d852e && 0x0 === _0x1cb967['length']) return alert('Veuillez\x20sélectionner\x20au\x20moins\x20une\x20garniture\x20ou\x20cocher\x20\x22sans\x20garniture\x22.'), !0x1;
      var _0x4a37dc = new FormData(this);
      _0x58a803["forEach"](_0x30fc5d => {
        const _0x457280 = _0x30fc5d["value"],
          _0x47bc6e = _0x30fc5d["closest"](".meat-selection-row"),
          _0x36e57b = _0x47bc6e ? _0x47bc6e['querySelector'](".meat-quantity-input") : null,
          _0x23c0ee = _0x36e57b && parseInt(_0x36e57b["value"], 0xa) || 0x1;
        _0x4a37dc["append"]("meat_quantity[" + _0x457280 + ']', _0x23c0ee);
      });
      var _0x39757d = getCsrfToken();
      fetch("ajax/et.php", {
        'method': 'POST',
        'headers': {
          'X-CSRF-Token': _0x39757d
        },
        'body': _0x4a37dc
      })["then"](_0x5815fc => {

        if (!_0x5815fc['ok']) throw new Error("ET Network response was not ok");
        return _0x5815fc['text']();
      })["then"](_0x3bc297 => {

        $("#tacosEditModal")["modal"]("hide"), loadExistingTacos(), refreshTacoListUI(), refreshCartSummary();
      })["catch"](_0x22b10d => console['error']("Error:", _0x22b10d));
    });
  }), document['addEventListener']("DOMContentLoaded", function() {
    const _0xcf6c19 = document['querySelectorAll']("input[name=\"extras\"]"),
      _0x23bbad = getCsrfToken();
    fetch("ajax/gse.php", {
      'method': 'POST',
      'headers': {
        'X-CSRF-Token': _0x23bbad
      }
    })["then"](_0x2805ec => {

      if (!_0x2805ec['ok']) throw 0x193 === _0x2805ec["status"] && console["log"]("GSE REFRESH"), new Error("GSE Network response was not ok");
      return _0x2805ec["json"]();
    })['then'](_0x19a9e6 => {

      Object["values"](_0x19a9e6)["forEach"](_0x26ab4a => {
        const _0x2be767 = document["getElementById"](_0x26ab4a['id']);
        if (_0x2be767) {
          _0x2be767["checked"] = !0x0;
          const _0x9a051c = _0x2be767['closest'](".form-check")["querySelector"](".extras-quantity-control");
          _0x9a051c['classList']["remove"]("d-none"), _0x9a051c['querySelector'](".quantity-input")["value"] = _0x26ab4a['quantity'];
          const _0x5e5d65 = document['getElementById']("free_sauce_select_" + _0x26ab4a['id']);
          if (_0x5e5d65) {
            if (_0x5e5d65["classList"]['remove']('d-none'), _0x26ab4a['free_sauces'] && Array['isArray'](_0x26ab4a["free_sauces"])) _0x5e5d65["querySelectorAll"]('select')['forEach']((_0x4fa08a, _0x1775c7) => {

              _0x26ab4a['free_sauces'][_0x1775c7] && _0x26ab4a["free_sauces"][_0x1775c7]['id'] && (_0x4fa08a["value"] = _0x26ab4a["free_sauces"][_0x1775c7]['id']);
            });
            else {
              if (_0x26ab4a["free_sauce"] && _0x26ab4a["free_sauce"]['id']) {
                const _0x595b07 = _0x5e5d65['querySelector']("select");
                _0x595b07 && (_0x595b07["value"] = _0x26ab4a["free_sauce"]['id']);
              }
            }
          }
        }
      });
    })["catch"](_0x352291 => console["error"]("Error:", _0x352291)), (document['querySelectorAll'](".free-sauces-container")["forEach"](_0x44778f => {
      const _0x5e329c = _0x44778f['id']["replace"]('free_sauce_select_', ''),
        _0x566517 = document["getElementById"](_0x5e329c);
      _0x566517 && _0x566517["checked"] || _0x44778f["classList"]["add"]("d-none");
    }), _0xcf6c19['forEach'](_0x32e72f => {

      _0x32e72f["addEventListener"]("change", function() {
        const _0x92e91f = this["closest"](".form-check")["querySelector"]('.extras-quantity-control'),
          _0x2c9aea = document["getElementById"]("free_sauce_select_" + this['id']);
        this["checked"] ? (_0x92e91f['classList']["remove"]("d-none"), _0x2c9aea && _0x2c9aea["classList"]['remove']("d-none")) : (_0x92e91f['classList']['add']('d-none'), _0x92e91f['querySelector'](".quantity-input")["value"] = 0x1, _0x2c9aea && (_0x2c9aea["classList"]['add']("d-none"), _0x2c9aea["querySelectorAll"]("select")['forEach'](_0x4ccb4e => {

          _0x4ccb4e["value"] = '';
        })));
        const _0x27ded4 = this['checked'],
          _0x432ccb = _0x27ded4 ? parseInt(_0x92e91f["querySelector"](".quantity-input")["value"], 0xa) : 0x0,
          _0x3fd826 = this['id'],
          _0xfc099d = this["getAttribute"]("value"),
          _0x5731c6 = this["closest"](".form-check")['querySelector'](".extras-info")["textContent"],
          _0x37c922 = parseFloat(_0x5731c6['replace']("CHF ", '')) || 0.5;
        ['extra_frites', "extra_nuggets", "extra_falafel", "extra_tenders", 'extra_onion_rings', "extra_pommes_gaufrettes", 'extra_mozarella_sticks', "extra_potatoes", 'extra_gaufrettes']["includes"](_0x3fd826) && _0x2c9aea && _0x27ded4 ? submitExtraSelectionWithSauces(_0x3fd826) : submitExtraSelection(_0x3fd826, _0xfc099d, _0x37c922, _0x432ccb);
      });
    }), document["querySelectorAll"]('.free-sauces-container\x20select')["forEach"](_0x3e99db => {
      _0x3e99db['addEventListener']('change', handleFreeSauceSelectionChange);
    }), document['querySelectorAll'](".extras-quantity-control .increase, .extras-quantity-control .decrease")["forEach"](_0x3a4393 => {

      _0x3a4393["addEventListener"]("click", function() {
        const _0x248793 = _0x3a4393["closest"]('.extras-quantity-control')["querySelector"](".quantity-input");
        let _0x2effa6 = parseInt(_0x248793["value"], 0xa);
        const _0x10f89d = _0x3a4393["closest"](".form-check")["querySelector"](".extra-checkbox"),
          _0x156121 = _0x10f89d['id'],
          _0x58cb9f = _0x10f89d["getAttribute"]("value"),
          _0x387a66 = _0x10f89d["closest"](".form-check")["querySelector"]('.extras-info')["textContent"],
          _0x1a403a = parseFloat(_0x387a66["replace"]("CHF ", '')) || 0.5;
        _0x3a4393["classList"]["contains"]('increase') ? _0x2effa6++ : _0x2effa6 > 0x1 && _0x2effa6--, _0x248793["value"] = _0x2effa6, ["extra_frites", "extra_nuggets", "extra_falafel", 'extra_tenders', "extra_onion_rings", "extra_pommes_gaufrettes", "extra_mozarella_sticks", "extra_potatoes", "extra_gaufrettes"]["includes"](_0x156121) ? (! function(_0x5d9806, _0x3110b0) {
          const _0x515c7a = "localhost" === window["location"]["hostname"] || "127.0.0.1" === window["location"]["hostname"];
          _0x515c7a && console['log']("updateFreeSauceOptions called with:", _0x5d9806, _0x3110b0);
          const _0x2196cf = document["getElementById"]('free_sauce_select_' + _0x5d9806);
          if (!_0x2196cf) return void(_0x515c7a && console['log']("No container found for:", 'free_sauce_select_' + _0x5d9806));
          const _0x51c227 = _0x2196cf["querySelectorAll"]("select"),
            _0x4fb19f = [];
          _0x51c227["forEach"](_0x32448c => {

            _0x32448c["value"] && _0x4fb19f["push"](_0x32448c["value"]);
          }), _0x515c7a && console["log"]("Saved selections:", _0x4fb19f), (_0x2196cf["innerHTML"] = '', _0x515c7a && console["log"]("Creating", _0x3110b0, 'sauce\x20options'));
          for (let _0x5b4265 = 0x1; _0x5b4265 <= _0x3110b0; _0x5b4265++) {
            const _0x481701 = document["createElement"]("div");
            _0x481701["className"] = "free-sauce-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center mb-2 mt-1";
            const _0xa30302 = _0x4fb19f[_0x5b4265 - 0x1] || '';
            let _0x5aabd1 = "<option value=\"\" disabled>Choisissez votre sauce offerte ici.</option>";
            window["availableSauces"] && Array["isArray"](window['availableSauces']) && (_0x5aabd1 = '<option\x20value=\x22\x22\x20disabled\x20' + (_0xa30302 ? '' : "selected") + ">Choisissez votre sauce offerte ici.</option>", window["availableSauces"]["forEach"](_0x106aa2 => {
              const _0x355b7b = _0xa30302 === _0x106aa2['id'] ? "selected" : '';
              _0x5aabd1 += "<option value=\"" + _0x106aa2['id'] + '\x22\x20' + _0x355b7b + '>' + _0x106aa2["name"] + '</option>';
            })), _0x481701["innerHTML"] = "\n      <i class=\"fa-solid fa-angles-up\" style=\"font-size: 22px; margin-right: 8px; color:#dc3545\"></i>\n      <span class=\"text-danger me-2\">" + _0x5b4265 + ".</span>\n      <select class=\"form-control text-danger form-select-sm\" name=\"free_sauce_" + _0x5d9806 + "[]\" data-item-index=\"" + _0x5b4265 + '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' + _0x5aabd1 + "\n      </select>\n    ", _0x2196cf["appendChild"](_0x481701);
          }
          _0x515c7a && console["log"]("Created", _0x3110b0, "sauce options for", _0x5d9806), ! function(_0x40d02c) {
            const _0x2035d7 = document["querySelectorAll"]("#free_sauce_select_" + _0x40d02c + " select");
            _0x2035d7["forEach"](_0x28c3ee => {

              _0x28c3ee["removeEventListener"]("change", handleFreeSauceSelectionChange), _0x28c3ee["addEventListener"]("change", handleFreeSauceSelectionChange);
            });
          }(_0x5d9806);
        }(_0x156121, _0x2effa6), submitExtraSelectionWithSauces(_0x156121)) : submitExtraSelection(_0x156121, _0x58cb9f, _0x1a403a, _0x2effa6);
      });
    })), document['querySelectorAll'](".free-sauce-checkbox")["forEach"](_0x85f34 => {

      _0x85f34["addEventListener"]("change", function() {
        const _0x5305c1 = document['getElementById']("free_sauce_" + this['id']);
        this["checked"] ? _0x5305c1["classList"]["remove"]("d-none") : _0x5305c1["classList"]['add']("d-none"), _0x5305c1["querySelector"]('select')["addEventListener"]("change", function() {

          submitExtraSelection(this["value"], this['options'][this["selectedIndex"]]["text"], 0x0, 0x1);
        });
      });
    });
  }), document['addEventListener']('DOMContentLoaded', function() {
    const _0x4fd6ed = document["querySelectorAll"]("input[name=\"boissons\"]");

    function submitDrinkSelection(_0x8e5a5f, _0x144cf6, _0x524d46, _0x2be603) {

      var _0x3ae88d = getCsrfToken();
      const _0x268b0a = {
        'id': _0x8e5a5f,
        'name': _0x144cf6,
        'price': _0x524d46,
        'quantity': _0x2be603
      };
      fetch('ajax/ubs.php', {
        'method': 'POST',
        'headers': {
          'X-CSRF-Token': _0x3ae88d
        },
        'body': JSON["stringify"](_0x268b0a)
      })["then"](_0x2bf3c2 => _0x2bf3c2["json"]())['then'](_0x23a90d => {
        refreshCartSummary();
      })["catch"](_0x4071c8 => console["error"]("Error:", _0x4071c8));
    }
    const _0x1f1d15 = getCsrfToken();
    fetch("ajax/gsb.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _0x1f1d15
      }
    })["then"](_0x33075f => {

      if (!_0x33075f['ok']) throw 0x193 === _0x33075f["status"] && console["log"]('GSB\x20REFRESH'), new Error('GSB\x20Network\x20response\x20was\x20not\x20ok');
      return _0x33075f["json"]();
    })["then"](_0x4e565b => {

      Object["values"](_0x4e565b)['forEach'](_0x5919f4 => {
        const _0x2dd92a = document["getElementById"](_0x5919f4['id']);
        if (_0x2dd92a) {
          _0x2dd92a["checked"] = !0x0;
          const _0x215f72 = _0x2dd92a['closest'](".form-check")['querySelector']('.boisson-quantity-control');
          _0x215f72["classList"]["remove"]("d-none"), _0x215f72["querySelector"](".quantity-input")['value'] = _0x5919f4["quantity"];
        }
      });
    })['catch'](_0x44a586 => console["error"]("Error:", _0x44a586)), _0x4fd6ed['forEach'](_0x1e039e => {

      _0x1e039e["addEventListener"]('change', function() {
        const _0x42e4dc = this["closest"](".form-check")["querySelector"]('.boisson-quantity-control');
        this['checked'] ? _0x42e4dc["classList"]["remove"]("d-none") : (_0x42e4dc["classList"]["add"]("d-none"), _0x42e4dc["querySelector"]('.quantity-input')["value"] = 0x1);
        const _0x236c43 = this["checked"] ? parseInt(_0x42e4dc["querySelector"](".quantity-input")["value"], 0xa) : 0x0,
          _0x437885 = this['id'],
          _0x217804 = this["getAttribute"]('value'),
          _0x49ee6c = this['closest']('.form-check')['querySelector'](".boissons-info")["textContent"];
        submitDrinkSelection(_0x437885, _0x217804, parseFloat(_0x49ee6c["replace"]("CHF ", '')) || 0.5, _0x236c43);
      });
    }), document["querySelectorAll"]('.boisson-quantity-control\x20.increase,\x20.boisson-quantity-control\x20.decrease')["forEach"](_0x302272 => {

      _0x302272["addEventListener"]("click", function() {
        const _0xde349e = this["closest"]('.boisson-quantity-control')["querySelector"](".quantity-input");
        let _0x2e2cb8 = parseInt(_0xde349e["value"], 0xa);
        _0x2e2cb8 += this['classList']["contains"]("increase") ? 0x1 : _0x2e2cb8 > 0x1 ? -0x1 : 0x0, _0xde349e["value"] = _0x2e2cb8;
        const _0x208b15 = this['closest'](".boisson-quantity-control")["getAttribute"]("data-boisson-id"),
          _0x3b3a8b = document["getElementById"](_0x208b15),
          _0x326289 = _0x3b3a8b['getAttribute']("value"),
          _0x228110 = _0x3b3a8b["closest"](".form-check")["querySelector"](".boissons-info")["textContent"];
        submitDrinkSelection(_0x208b15, _0x326289, parseFloat(_0x228110["replace"]("CHF ", '')) || 0.5, _0x2e2cb8);
      });
    });
  }), document["addEventListener"]('DOMContentLoaded', function() {
    const _0x485491 = document['querySelectorAll']("input[name=\"desserts\"]");

    function submitDessertSelection(_0x4a6d01, _0x5b4df2, _0x44a2f8, _0x1c3334) {

      var _0x43f072 = getCsrfToken();
      const _0xf28ac5 = {
        'id': _0x4a6d01,
        'name': _0x5b4df2,
        'price': _0x44a2f8,
        'quantity': _0x1c3334
      };
      fetch("ajax/uds.php", {
        'method': "POST",
        'headers': {
          'X-CSRF-Token': _0x43f072
        },
        'body': JSON['stringify'](_0xf28ac5)
      })['then'](_0x5addaa => _0x5addaa["json"]())['then'](_0x3a02a0 => {
        refreshCartSummary();
      })["catch"](_0x130ccf => console["error"]("Error:", _0x130ccf));
    }
    const _0x119505 = getCsrfToken();
    fetch("ajax/gsd.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _0x119505
      }
    })['then'](_0x3f0fc9 => {

      if (!_0x3f0fc9['ok']) throw 0x193 === _0x3f0fc9["status"] && console["log"]('GSD\x20REFRESH'), new Error("GSD Network response was not ok");
      return _0x3f0fc9["json"]();
    })["then"](_0x10058d => {

      Object['values'](_0x10058d)["forEach"](_0x39a3c6 => {
        const _0x55c3cf = document["getElementById"](_0x39a3c6['id']);
        if (_0x55c3cf) {
          _0x55c3cf["checked"] = !0x0;
          const _0x4668a6 = _0x55c3cf["closest"]('.form-check')["querySelector"](".dessert-quantity-control");
          _0x4668a6['classList']["remove"]('d-none'), _0x4668a6["querySelector"]('.quantity-input')["value"] = _0x39a3c6["quantity"];
        }
      });
    })["catch"](_0x362336 => console["error"]('Error:', _0x362336)), _0x485491["forEach"](_0x16f575 => {

      _0x16f575["addEventListener"]("change", function() {
        const _0x454838 = this["closest"](".form-check")["querySelector"](".dessert-quantity-control");
        this["checked"] ? _0x454838['classList']["remove"]("d-none") : (_0x454838["classList"]["add"]("d-none"), _0x454838["querySelector"](".quantity-input")['value'] = 0x1);
        const _0x1b071e = this["checked"] ? parseInt(_0x454838["querySelector"]('.quantity-input')["value"], 0xa) : 0x0,
          _0x437937 = this['id'],
          _0x1d6814 = this["getAttribute"]('value'),
          _0x25409d = this["closest"]('.form-check')["querySelector"](".desserts-info")["textContent"];
        submitDessertSelection(_0x437937, _0x1d6814, parseFloat(_0x25409d["replace"]('CHF\x20', '')) || 0.5, _0x1b071e);
      });
    }), document['querySelectorAll'](".dessert-quantity-control .increase, .dessert-quantity-control .decrease")['forEach'](_0x2db0de => {

      _0x2db0de["addEventListener"]("click", function() {
        const _0x5e666d = this['closest'](".dessert-quantity-control")["querySelector"](".quantity-input");
        let _0x424dba = parseInt(_0x5e666d["value"], 0xa);
        _0x424dba += this["classList"]['contains']('increase') ? 0x1 : _0x424dba > 0x1 ? -0x1 : 0x0, _0x5e666d['value'] = _0x424dba;
        const _0x2dafbb = this['closest'](".dessert-quantity-control")["getAttribute"]("data-dessert-id"),
          _0x2f943e = document["getElementById"](_0x2dafbb),
          _0x25ff2f = _0x2f943e["getAttribute"]("value"),
          _0x262a57 = _0x2f943e["closest"](".form-check")['querySelector'](".desserts-info")['textContent'];
        submitDessertSelection(_0x2dafbb, _0x25ff2f, parseFloat(_0x262a57['replace']('CHF\x20', '')) || 0.5, _0x424dba);
      });
    });
  }), document["addEventListener"]('DOMContentLoaded', refreshCategoryBadges), document['addEventListener']("DOMContentLoaded", refreshCartSummary), document["addEventListener"]("DOMContentLoaded", function() {

    document["getElementById"]("orderModal")["addEventListener"]("show.bs.modal", function(_0x1ae7af) {

      var _0x486822 = getCsrfToken();
      fetch("ajax/os.php", {
        'method': 'POST',
        'headers': {
          'Content-Type': "application/x-www-form-urlencoded"
        },
        'body': "csrf_token=" + encodeURIComponent(_0x486822)
      })["then"](_0x19dbb3 => {

        if (!_0x19dbb3['ok']) throw 0x193 === _0x19dbb3['status'] && console['log']("OS REFRESH"), new Error("Network response was not ok");
        return _0x19dbb3["text"]();
      })["then"](_0x127da7 => {
        document['querySelector']('#orderModal\x20.order-summary')['innerHTML'] = _0x127da7;
      })["catch"](_0x3be85e => console["error"]('Error\x20loading\x20the\x20order\x20summary:', _0x3be85e));
    });
  }), document["getElementById"]("selectProduct")['addEventListener']('change', function() {

    toggleTacoOptionsBySize(this["value"], "add_");
  }), document["getElementById"]("tacosEditModal")['addEventListener']("show.bs.modal", function() {

    toggleTacoOptionsBySize(document["getElementById"]("editTaille")['value'], "edit_");
  }), document["addEventListener"]("DOMContentLoaded", function() {

    document['querySelector']("#confirmMinOrderModal .btn-danger")["addEventListener"]("click", function() {

      new bootstrap['Modal'](document["getElementById"]('confirmMinOrderModal'))["hide"](), setTimeout(function() {

        new bootstrap[("Modal")](document["getElementById"]("orderModal"))['show']();
      }, 0x1f4);
    });
  }), document["addEventListener"]("DOMContentLoaded", function() {
    const _0x69b6ef = document["getElementById"]("selectProduct");

    function setInputsDisabled(_0x663f96, _0x30d55f = !0x0) {

      _0x663f96["forEach"](_0x8270e9 => {

        _0x8270e9["disabled"] = _0x30d55f, _0x30d55f && (_0x8270e9["checked"] = !0x1);
      });
    }

    function enforceMeatSelectionLimit(_0x226765) {

      let _0x168391 = [...meatCheckboxes]["filter"](_0x2746b1 => _0x2746b1["checked"])["length"];
      meatCheckboxes["forEach"](_0x5b8c6f => {
        _0x5b8c6f['addEventListener']('change', () => {

          _0x168391 = [...meatCheckboxes]["filter"](_0x2e0bc3 => _0x2e0bc3["checked"])["length"], _0x168391 >= _0x226765 ? setInputsDisabled([...meatCheckboxes]["filter"](_0x5b7bc1 => !_0x5b7bc1['checked']), !0x0) : setInputsDisabled(meatCheckboxes, !0x1);
        });
      });
    }
    meatCheckboxes = document["querySelectorAll"]("input[name=\"viande[]\"]"), sauceCheckboxes = document["querySelectorAll"]("input[name=\"sauce[]\"]"), garnishCheckboxes = document['querySelectorAll']("input[name=\"garniture[]\"]"), _0x69b6ef["addEventListener"]('change', () => {

      [...meatCheckboxes, ...sauceCheckboxes, ...garnishCheckboxes]["forEach"](_0xb20a2e => {

        _0xb20a2e["checked"] = !0x1;
      });
      const _0x196dff = _0x69b6ef["value"];
      switch (setInputsDisabled(meatCheckboxes, !0x1), setInputsDisabled(sauceCheckboxes, !0x1), setInputsDisabled(garnishCheckboxes, !0x1), _0x196dff) {
        case 'tacos_L':
          enforceMeatSelectionLimit(0x1);
          break;
        case "tacos_BOWL":
          enforceMeatSelectionLimit(0x2);
          break;
        case "tacos_L_mixte":
        case "tacos_XL":
          enforceMeatSelectionLimit(0x3);
          break;
        case 'tacos_XXL':
          enforceMeatSelectionLimit(0x4);
          break;
        case "tacos_GIGA":
          enforceMeatSelectionLimit(0x5);
          break;
        default:
          setInputsDisabled(meatCheckboxes, !0x0), setInputsDisabled(sauceCheckboxes, !0x0), setInputsDisabled(garnishCheckboxes, !0x0);
      }
      sauceCheckboxes["forEach"](_0x205ffb => {

        _0x205ffb['addEventListener']("change", () => {

          [...sauceCheckboxes]["filter"](_0x3c6da6 => _0x3c6da6["checked"])["length"] >= 0x3 ? setInputsDisabled([...sauceCheckboxes]["filter"](_0x5e9e1c => !_0x5e9e1c["checked"]), !0x0) : setInputsDisabled(sauceCheckboxes, !0x1);
        });
      });
    }), (document["querySelectorAll"](".add-tacos-button")['forEach'](_0x5be73c => {

      _0x5be73c["addEventListener"]("click", function(_0x42e613) {

        _0x42e613["preventDefault"](), !async function(_0x343318) {

          new bootstrap[("Modal")](document["getElementById"]("tacosAddModal"), {
            'keyboard': !0x1
          })["show"](), document["getElementById"]("selectProduct")["value"] = _0x343318, _0x69b6ef["dispatchEvent"](new Event('change', {
            'bubbles': !0x0,
            'cancelable': !0x0
          })), await fetchStockAvailability(), applyStockAvailability();
        }(this['getAttribute']("data-tacos-type"));
      });
    }), setInputsDisabled(meatCheckboxes), setInputsDisabled(sauceCheckboxes), setInputsDisabled(garnishCheckboxes), $("#tacosAddModal")['on']("hidden.bs.modal", function() {

      resetTacoForm(), _0x69b6ef["value"] = 'null', setInputsDisabled(meatCheckboxes, !0x0), setInputsDisabled(sauceCheckboxes, !0x0), setInputsDisabled(garnishCheckboxes, !0x0);
    }));
  }), $('#tacosForm')["submit"](function(_0x5d76a5) {

    _0x5d76a5["preventDefault"]();
    const _0x2b8cf5 = document["getElementById"]("selectProduct")["value"],
      _0x2df9c0 = document["querySelectorAll"]("input[name=\"viande[]\"]:checked"),
      _0x436197 = document["querySelectorAll"]("input[name=\"sauce[]\"]:checked"),
      _0x2dcc7d = document["querySelectorAll"]("input[name=\"garniture[]\"]:checked");
    document["querySelector"]("input[name=\"viande[]\"][value=\"sans\"]:checked"), document["querySelector"]('input[name=\x22sauce[]\x22][value=\x22sans\x22]:checked'), document["querySelector"]("input[name=\"garniture[]\"][value=\"sans\"]:checked");
    if (0x0 === _0x2df9c0["length"]) return alert("Veuillez s\u00e9lectionner au moins une viande ou cocher \"sans viande\"."), !0x1;
    if (0x0 === _0x436197["length"]) return alert("Veuillez s\u00e9lectionner au moins une sauce ou cocher \"sans sauce\"."), !0x1;
    if ("tacos_BOWL" !== _0x2b8cf5 && 0x0 === _0x2dcc7d["length"]) return alert('Veuillez\x20sélectionner\x20au\x20moins\x20une\x20garniture\x20ou\x20cocher\x20\x22sans\x20garniture\x22.'), !0x1;
    var _0x22bd28 = getCsrfToken();
    const _0x83e35c = {};
    _0x2df9c0["forEach"](_0x34e18d => {
      const _0x281d57 = _0x34e18d['value'],
        _0x16ef78 = _0x34e18d['closest'](".meat-selection-row"),
        _0x402287 = _0x16ef78 ? _0x16ef78["querySelector"](".meat-quantity-input") : null,
        _0x1abbe5 = _0x402287 && parseInt(_0x402287["value"], 0xa) || 0x1;
      _0x83e35c[_0x281d57] = _0x1abbe5;
    });
    let _0xe34811 = $(this)['serialize']();
    Object["keys"](_0x83e35c)["forEach"](_0x2cefc4 => {

      _0xe34811 += "&meat_quantity[" + _0x2cefc4 + ']=' + _0x83e35c[_0x2cefc4];
    }), $["ajax"]({
      'type': 'POST',
      'url': "ajax/owt.php",
      'headers': {
        'X-CSRF-Token': _0x22bd28
      },
      'data': _0xe34811,
      'success': function(_0x3a0047) {

        $("#products-list")["append"](_0x3a0047), $("#product-messages")['empty'](), loadExistingTacos(), refreshTacoListUI(), refreshCartSummary();
      },
      'error': function() {
        alert('Error\x20on\x20submit.\x20Please\x20try\x20again.');
      }
    }), $("#tacosAddModal")["modal"]('hide'), resetTacoForm();
  }), $(document)['on']("click", ".delete-tacos", function(_0x314073) {

    _0x314073["preventDefault"]();
    var _0x1ea80e = $(this)['attr']('data-index');
    if (confirm("\u00cates-vous s\u00fbr de vouloir supprimer ce produit\u00a0?")) {
      var _0x49e47e = getCsrfToken();
      $["ajax"]({
        'url': "ajax/dt.php",
        'headers': {
          'X-CSRF-Token': _0x49e47e
        },
        'type': "POST",
        'data': {
          'index': _0x1ea80e
        },
        'success': function(_0x20d692) {

          $('#tacos-' + _0x1ea80e)["remove"](), refreshTacoListUI(), refreshCartSummary();
        },
        'error': function() {
          alert('Error\x20on\x20delete.\x20Please\x20try\x20again.');
        }
      });
    }
  }), $(document)["ready"](function() {
    loadExistingTacos();
  }), document["getElementById"]("orderForm")['addEventListener']("submit", function(_0x3dad45) {

    _0x3dad45["preventDefault"]();
    const _0x4f1851 = document["getElementById"]('finalizeButton'),
      _0x40ee4f = _0x4f1851 ? _0x4f1851['innerHTML'] : 'Finaliser\x20la\x20commande';
    if (document["getElementById"]("phone")['value'] !== document["getElementById"]("confirmPhone")['value']) return void alert("Les num\u00e9ros de t\u00e9l\u00e9phone ne correspondent pas, veuillez v\u00e9rifier !");
    _0x4f1851 && (_0x4f1851['disabled'] = !0x0, _0x4f1851["innerHTML"] = "<span class=\"spinner-border spinner-border-sm me-2\"></span>Traitement en cours...", _0x4f1851["classList"]["add"]("disabled"));
    const _0x32f5c8 = Date["now"]() + '_' + Math['random']()['toString'](0x24)['substr'](0x2, 0x9),
      _0x312021 = getCsrfToken();
    var _0x5cc408 = new FormData(this);
    _0x5cc408["append"]("transaction_id", _0x32f5c8), fetch("ajax/RocknRoll.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': _0x312021
      },
      'body': _0x5cc408
    })["then"](_0x5bfbb0 => {

      if (!_0x5bfbb0['ok']) {
        if (0x199 === _0x5bfbb0["status"]) return _0x5bfbb0['json']()["then"](_0x5a1e72 => {
          throw new Error('DUPLICATE_ORDER');
        });
        if (0x193 === _0x5bfbb0["status"]) return _0x5bfbb0["text"]()['then'](_0x33cc81 => {

          if (_0x33cc81["includes"]('1\x20Order\x20per\x20minute') || _0x33cc81['includes']("Maximum")) throw new Error("RATE_LIMIT");
          throw new Error("FORBIDDEN");
        });
        throw new Error('RocknRoll\x20Network\x20response\x20was\x20not\x20ok');
      }
      return _0x5bfbb0["json"]();
    })['then'](_0x28660b => {

      if (!_0x28660b) throw console["error"]("Unexpected response structure:", _0x28660b), new Error("Error during order processing");
      {
        _0x4f1851 && (_0x4f1851["classList"]["remove"]("btn-danger"), _0x4f1851["classList"]["add"]("btn-success"), _0x4f1851['innerHTML'] = "<i class=\"fas fa-check me-2\"></i>Commande confirm\u00e9e!"), localStorage["removeItem"]("accordionState"), document["querySelectorAll"](".collapse.show")["forEach"](_0x35f863 => {

          new bootstrap[("Collapse")](_0x35f863, {
            'toggle': !0x1
          })["hide"]();
        });
        var _0x144cb2 = localStorage['getItem']('order_stories');
        (_0x144cb2 = _0x144cb2 ? JSON["parse"](_0x144cb2) : [])['push'](_0x28660b), localStorage["setItem"]('order_stories', JSON["stringify"](_0x144cb2));
        let _0x349c4d = '';
        "livraison" === new URLSearchParams(window["location"]["search"])["get"]("content") ? _0x349c4d = '<div\x20class=\x22d-flex\x20justify-content-center\x20align-items-center\x22\x20style=\x22height:\x20100px;\x22><i\x20class=\x27fa\x20fa-check-circle\x27\x20style=\x27color:\x20green;\x20font-size:\x20100px;\x27></i></div><br\x20/>Votre\x20commande\x20a\x20été\x20reçue\x20et\x20sera\x20préparée.<br>Restez\x20joignable\x20s\x27il\x20vous\x20plaît.<br>Celui-ci\x20sera\x20mis\x20à\x20jour\x20lorsque\x20votre\x20commande\x20sera\x20en\x20route.' : "emporter" === new URLSearchParams(window["location"]["search"])["get"]("content") && (_0x349c4d = "<div class=\"d-flex justify-content-center align-items-center\" style=\"height: 100px;\"><i class='fa fa-check-circle' style='color: green; font-size: 100px; margin-right: 15px;'></i>Votre commande a \u00e9t\u00e9 re\u00e7ue et sera pr\u00e9par\u00e9e.</div>"), $("#orderModal")['on']("hidden.bs.modal", function() {

          $('#successModalBody')["html"](_0x349c4d), $("#successModal")['modal']("show");
        })["modal"]("hide"), $('#successModal')['on']("hidden.bs.modal", function() {

          window["location"]['reload']();
        }), gtag("event", 'purchase', {
          'transaction_id': _0x28660b["orderId"],
          'affiliation': "Website",
          'value': _0x28660b['OrderData']['price'],
          'currency': "CHF"
        });
      }
    })["catch"](_0x46a311 => {

      "undefined" != typeof isDevMode && isDevMode && (console["error"]("Error type:", _0x46a311["name"]), console["error"]('Error\x20message:', _0x46a311["message"]), console["error"]('Error\x20stack:', _0x46a311["stack"])), _0x4f1851 && ("DUPLICATE_ORDER" === _0x46a311["message"] ? (_0x4f1851["classList"]['remove']("btn-danger"), _0x4f1851["classList"]["add"]('btn-info'), _0x4f1851["innerHTML"] = "<i class=\"fas fa-info-circle me-2\"></i>Cette commande a d\u00e9j\u00e0 \u00e9t\u00e9 trait\u00e9e", setTimeout(() => {

        _0x4f1851['disabled'] = !0x1, _0x4f1851['classList']['remove']('btn-info', "disabled"), _0x4f1851['classList']["add"]("btn-danger"), _0x4f1851["innerHTML"] = _0x40ee4f;
      }, 0xbb8)) : "RATE_LIMIT" === _0x46a311["message"] ? (_0x4f1851["classList"]["remove"]('btn-danger'), _0x4f1851["classList"]["add"]("btn-warning"), _0x4f1851["innerHTML"] = '<i\x20class=\x22fas\x20fa-exclamation-triangle\x20me-2\x22></i>Veuillez\x20patienter\x201\x20minute', setTimeout(() => {

        _0x4f1851["disabled"] = !0x1, _0x4f1851["classList"]['remove']('btn-warning', "disabled"), _0x4f1851["classList"]['add']("btn-danger"), _0x4f1851["innerHTML"] = _0x40ee4f;
      }, 0x1388)) : _0x46a311['message']["includes"]("Network") ? (_0x4f1851["classList"]["add"]("btn-danger"), _0x4f1851['innerHTML'] = "<i class=\"fas fa-wifi me-2\"></i>Erreur de connexion", setTimeout(() => {

        _0x4f1851["disabled"] = !0x1, _0x4f1851["classList"]["remove"]("disabled"), _0x4f1851['innerHTML'] = _0x40ee4f;
      }, 0xbb8)) : (_0x4f1851["classList"]["add"]('btn-danger'), _0x4f1851['innerHTML'] = "<i class=\"fas fa-times me-2\"></i>Erreur - Veuillez r\u00e9essayer", setTimeout(() => {

        _0x4f1851['disabled'] = !0x1, _0x4f1851["classList"]["remove"]('disabled'), _0x4f1851["innerHTML"] = _0x40ee4f;
      }, 0xbb8))), "RATE_LIMIT" === _0x46a311["message"] ? alert("Vous avez d\u00e9j\u00e0 pass\u00e9 une commande r\u00e9cemment. Veuillez patienter 1 minute avant de commander \u00e0 nouveau.") : "FORBIDDEN" === _0x46a311["message"] ? alert("Acc\u00e8s refus\u00e9. Veuillez r\u00e9essayer.") : _0x46a311["message"]["includes"]("Network") ? alert("Probl\u00e8me de connexion. V\u00e9rifiez votre connexion internet et r\u00e9essayez.") : alert("Une erreur est survenue lors de la soumission du formulaire. Veuillez r\u00e9essayer.");
    });
  }), document["addEventListener"]("DOMContentLoaded", function() {
    const _0x2080bf = document["getElementById"]("addToHomeText"),
      _0x12fe61 = document["getElementById"]("bannerLogo"),
      _0x63a503 = navigator['userAgent']["toLowerCase"]();

    function updateAddToHomePrompt(_0x5b4b93, _0x24442b) {
      _0x2080bf['textContent'] = _0x5b4b93, _0x12fe61['src'] = _0x24442b;
    }
    /iphone|ipad/ ["test"](_0x63a503) ? updateAddToHomePrompt("Appuyez sur l\u2019ic\u00f4ne de partage (en bas au centre) et s\u00e9lectionnez \u00ab Ajouter \u00e0 l\u2019\u00e9cran d\u2019accueil \u00bb.", './images/ios-share.png'): /android/ ['test'](_0x63a503) && updateAddToHomePrompt("Dans le menu du navigateur (en haut \u00e0 droite), s\u00e9lectionnez \u00ab Ajouter \u00e0 l\u2019\u00e9cran d\u2019accueil \u00bb.", "./images/android-share.png");
  });
  let maxMeatPortions = 0x1;

  function handleFreeSauceSelectionChange(_0x4587bf) {
    const _0x535624 = _0x4587bf["target"]["closest"](".free-sauces-container");
    _0x535624 && submitExtraSelectionWithSauces(_0x535624['id']["replace"]("free_sauce_select_", ''));
  }

  function submitExtraSelectionWithSauces(_0x49881d) {
    const _0x6a5a15 = document["getElementById"](_0x49881d),
      _0x406233 = _0x6a5a15["closest"]('.form-check')["querySelector"](".quantity-input"),
      _0x51a4cd = parseInt(_0x406233["value"], 0xa),
      _0x2b41ff = _0x6a5a15["getAttribute"]('value'),
      _0x378ceb = _0x6a5a15["closest"]('.form-check')["querySelector"](".extras-info")["textContent"],
      _0x3f0e8f = parseFloat(_0x378ceb["replace"]("CHF ", '')) || 0.5,
      _0x5a154b = document["querySelectorAll"]("#free_sauce_select_" + _0x49881d + " select"),
      _0x3a812d = [];
    _0x5a154b["forEach"](_0x5559ea => {

      if (_0x5559ea["value"]) {
        const _0x5bc344 = _0x5559ea["options"][_0x5559ea["selectedIndex"]]['text'];
        _0x3a812d["push"]({
          'id': _0x5559ea["value"],
          'name': _0x5bc344,
          'price': 0x0
        });
      }
    }), submitExtraSelection(_0x49881d, _0x2b41ff, _0x3f0e8f, _0x51a4cd, null, null, _0x3a812d);
  }
  document["addEventListener"]("DOMContentLoaded", function() {
    const _0x460fab = document["getElementById"]("selectProduct"),
      _0x44c59b = document['querySelectorAll']("input[name=\"viande[]\"]"),
      _0x147a8f = document["querySelectorAll"]("input[name=\"sauce[]\"]"),
      _0x4416e6 = document['querySelectorAll']("input[name=\"garniture[]\"]");

    function enforceMeatQuantityLimits() {
      const _0x32cb0a = [..._0x44c59b]["filter"](_0x23aac3 => _0x23aac3["checked"]);
      let _0x39dff6 = 0x0;
      0x1 === maxMeatPortions ? _0x39dff6 = _0x32cb0a["length"] : _0x32cb0a["forEach"](_0x5232bf => {
        const _0x492872 = _0x5232bf["closest"](".meat-selection-row");
        if (_0x492872) {
          const _0x5ecbbb = _0x492872['querySelector'](".meat-quantity-input"),
            _0x2684e2 = parseInt(_0x5ecbbb?.["value"] || 0x1);
          _0x39dff6 += _0x2684e2;
        }
      }), _0x44c59b["forEach"](_0x47b119 => {

        _0x47b119["checked"] || (_0x47b119["disabled"] = _0x39dff6 >= maxMeatPortions);
      }), _0x32cb0a["forEach"](_0x134da7 => {
        const _0x18bce7 = _0x134da7["closest"](".meat-selection-row");
        if (_0x18bce7) {
          const _0x2ebe79 = _0x18bce7['querySelector'](".meat-quantity-input");
          if (_0x2ebe79) {
            const _0x21b4b0 = parseInt(_0x2ebe79['value']),
              _0x355d63 = maxMeatPortions - _0x39dff6 + _0x21b4b0;
            _0x2ebe79["max"] = Math['min'](_0x355d63, 0x5), _0x21b4b0 > _0x2ebe79["max"] && (_0x2ebe79["value"] = _0x2ebe79['max']);
          }
        }
      });
    }
    _0x44c59b["forEach"](_0x13e067 => {

      _0x13e067["addEventListener"]("change", function() {
        const _0x566657 = this['closest']('.meat-selection-row');
        if (_0x566657) {
          const _0x4e4244 = _0x566657["querySelector"](".meat-quantity-control");
          if (_0x4e4244) {
            if (this["checked"] && maxMeatPortions > 0x1) _0x4e4244["classList"]["remove"]('d-none'), enforceMeatQuantityLimits();
            else {
              _0x4e4244["classList"]["add"]("d-none");
              const _0x802dc2 = _0x4e4244["querySelector"](".meat-quantity-input");
              _0x802dc2 && (_0x802dc2["value"] = 0x1);
            }
          }
        }
        enforceMeatQuantityLimits();
      });
    }), document["querySelectorAll"](".increase-meat")['forEach'](_0x2f595b => {

      _0x2f595b["addEventListener"]('click', function() {
        const _0x1d40b5 = this["parentElement"]["querySelector"](".meat-quantity-input");
        if (_0x1d40b5) {
          const _0x309dc3 = parseInt(_0x1d40b5["value"]) || 0x1;
          _0x309dc3 < (parseInt(_0x1d40b5["max"]) || maxMeatPortions) && (_0x1d40b5["value"] = _0x309dc3 + 0x1, enforceMeatQuantityLimits());
        }
      });
    }), document["querySelectorAll"](".decrease-meat")["forEach"](_0x154400 => {

      _0x154400["addEventListener"]("click", function() {
        const _0x894774 = this["parentElement"]["querySelector"](".meat-quantity-input");
        if (_0x894774) {
          const _0xd88152 = parseInt(_0x894774['value']) || 0x1;
          _0xd88152 > 0x1 && (_0x894774["value"] = _0xd88152 - 0x1, enforceMeatQuantityLimits());
        }
      });
    }), _0x147a8f['forEach'](_0x2db7e5 => {

      _0x2db7e5["addEventListener"]("change", function() {

        [..._0x147a8f]['filter'](_0x427e0c => _0x427e0c['checked'])["length"] >= 0x3 ? [..._0x147a8f]["filter"](_0x3dc028 => !_0x3dc028["checked"])["forEach"](_0x2b6583 => _0x2b6583["disabled"] = !0x0) : _0x147a8f["forEach"](_0x356c36 => {

          _0x356c36["checked"] || (_0x356c36["disabled"] = !0x1);
        });
      });
    }), _0x460fab && (_0x460fab["addEventListener"]('change', function() {
      const _0x3d76d2 = this["value"];
      switch ([..._0x44c59b, ..._0x147a8f, ..._0x4416e6]["forEach"](_0x1f1dd1 => {

          _0x1f1dd1["checked"] = !0x1, _0x1f1dd1["disabled"] = !0x1;
        }), document["querySelectorAll"](".meat-quantity-control")["forEach"](_0x18e315 => {

          _0x18e315["classList"]['add']("d-none");
          const _0x473994 = _0x18e315["querySelector"]('.meat-quantity-input');
          _0x473994 && (_0x473994["value"] = 0x1);
        }), _0x3d76d2) {
        case "tacos_L":
          maxMeatPortions = 0x1;
          break;
        case "tacos_BOWL":
          maxMeatPortions = 0x2;
          break;
        case "tacos_L_mixte":
        case 'tacos_XL':
          maxMeatPortions = 0x3;
          break;
        case 'tacos_XXL':
          maxMeatPortions = 0x4;
          break;
        case "tacos_GIGA":
          maxMeatPortions = 0x5;
          break;
        default:
          return maxMeatPortions = 0x0, void[..._0x44c59b, ..._0x147a8f, ..._0x4416e6]["forEach"](_0x4ddade => _0x4ddade["disabled"] = !0x0);
      } [..._0x44c59b, ..._0x147a8f, ..._0x4416e6]["forEach"](_0x18014a => _0x18014a["disabled"] = !0x1);
    }), [..._0x44c59b, ..._0x147a8f, ..._0x4416e6]["forEach"](_0x3317b1 => _0x3317b1['disabled'] = !0x0)), $("#tacosAddModal")['on']("hidden.bs.modal", function() {

      _0x460fab && (_0x460fab["value"] = "null", [..._0x44c59b, ..._0x147a8f, ..._0x4416e6]["forEach"](_0x316bb9 => {

        _0x316bb9["checked"] = !0x1, _0x316bb9["disabled"] = !0x0;
      }), document['querySelectorAll'](".meat-quantity-control")['forEach'](_0x2bf7c7 => {

        _0x2bf7c7["classList"]["add"]("d-none");
        const _0xd33737 = _0x2bf7c7['querySelector']('.meat-quantity-input');
        _0xd33737 && (_0xd33737["value"] = 0x1);
      }), maxMeatPortions = 0x0);
    });
  }), document['addEventListener']("DOMContentLoaded", function() {

    document["querySelectorAll"]("#tacosEditForm input[name=\"viande[]\"]")['forEach'](_0x41f40e => {

      _0x41f40e["addEventListener"]("change", function() {
        const _0x2d7bf8 = this["closest"](".meat-selection-row");
        if (_0x2d7bf8) {
          const _0x4ba95a = _0x2d7bf8["querySelector"]('.meat-quantity-control');
          if (_0x4ba95a) {
            let _0x3e63b2 = 0x1;
            switch (document["getElementById"]("editSelectProduct")["value"]) {
              case "tacos_L":
                _0x3e63b2 = 0x1;
                break;
              case "tacos_L_mixte":
              case "tacos_XL":
                _0x3e63b2 = 0x3;
                break;
              case "tacos_XXL":
                _0x3e63b2 = 0x4;
                break;
              case "tacos_GIGA":
                _0x3e63b2 = 0x5;
            }
            const _0x36a9fc = _0x4ba95a["querySelector"]('.meat-quantity-input');
            this["checked"] && _0x3e63b2 > 0x1 ? (_0x4ba95a["classList"]["remove"]("d-none"), _0x36a9fc && (_0x36a9fc["disabled"] = !0x1)) : (_0x4ba95a["classList"]["add"]("d-none"), _0x36a9fc && (_0x36a9fc["value"] = 0x1, _0x36a9fc["disabled"] = !0x0));
          }
        }
      });
    }), document["querySelectorAll"]("#tacosEditForm .increase-meat")['forEach'](_0x4ed2c5 => {

      _0x4ed2c5["addEventListener"]("click", function() {
        const _0x38db9b = this["parentElement"]['querySelector'](".meat-quantity-input");
        if (_0x38db9b) {
          const _0x117e57 = parseInt(_0x38db9b["value"]) || 0x1;
          _0x117e57 < (parseInt(_0x38db9b["max"]) || 0x5) && (_0x38db9b["value"] = _0x117e57 + 0x1);
        }
      });
    }), document["querySelectorAll"]("#tacosEditForm .decrease-meat")["forEach"](_0x41a64c => {

      _0x41a64c["addEventListener"]("click", function() {
        const _0x415698 = this['parentElement']['querySelector'](".meat-quantity-input");
        if (_0x415698) {
          const _0x44945f = parseInt(_0x415698["value"]) || 0x1;
          _0x44945f > 0x1 && (_0x415698["value"] = _0x44945f - 0x1);
        }
      });
    });
  }), document["addEventListener"]('DOMContentLoaded', function() {

    try {
      if (!window["location"]["search"]['includes']("content=livraison")) return;
      const _0x3e72d8 = document['querySelector']('select[name=\x22requestedFor\x22]'),
        _0x44e783 = document["getElementById"]("deliveryDemandWarning"),
        _0x2ea230 = document["getElementById"]("demandMessage");
      if (_0x3e72d8 && _0x44e783 && _0x2ea230) {
        let _0x4340e1 = !0x1;
        _0x3e72d8["addEventListener"]("change", function() {
          const _0x714556 = this['value'];
          _0x714556 && '' !== _0x714556 ? updateDeliveryDemandBanner(_0x714556) : _0x44e783['classList']['add']('d-none');
        }), _0x3e72d8["value"] && '' !== _0x3e72d8['value'] && updateDeliveryDemandBanner(_0x3e72d8["value"]);
        const _0x5d2821 = document["querySelector"]("#orderModal");
        _0x5d2821 && _0x5d2821["addEventListener"]('shown.bs.modal', function() {
          _0x4340e1 || (!(function() {
            const _0x5c0093 = document["querySelector"]("select[name=\"requestedFor\"]");
            if (!_0x5c0093) return;
            const _0x159d18 = document["querySelector"]("input[name=\"csrf_token\"]")?.["value"] || '';
            fetch('ajax/check_delivery_demand.php', {
              'method': "POST",
              'headers': {
                'Content-Type': "application/json",
                'X-CSRF-TOKEN': _0x159d18
              },
              'body': JSON["stringify"]({
                'check_all': !0x0
              })
            })["then"](_0x1dd51b => _0x1dd51b["json"]())["then"](_0x1131b1 => {

              'success' === _0x1131b1['status'] && _0x1131b1["time_slots"] && _0x5c0093['querySelectorAll']("option[value]:not([value=\"\"])")['forEach'](_0x3f4eee => {
                const _0x511a78 = _0x3f4eee["value"],
                  _0xe8231d = [_0x511a78, _0x511a78 + ":00"];
                let _0x75ed77 = !0x1;
                for (const _0x70bc3d of _0xe8231d)
                  if (_0x1131b1['time_slots'][_0x70bc3d] && _0x1131b1["time_slots"][_0x70bc3d]["is_high_demand"]) {
                    _0x75ed77 = !0x0;
                    break;
                  } if (_0x75ed77 && !_0x3f4eee["textContent"]["includes"]("Forte affluence")) {
                  const _0x138749 = _0x3f4eee['textContent'];
                  _0x3f4eee['textContent'] = _0x138749 + " (Forte affluence)", _0x3f4eee["style"]['color'] = '#dc3545', _0x3f4eee["classList"]["add"]('high-demand');
                }
              });
            })["catch"](_0x4a1a5e => {

              console["error"]("Error checking all time slots:", _0x4a1a5e);
            });
          }()), _0x4340e1 = !0x0);
        });
      }

      function updateDeliveryDemandBanner(_0xaa5017) {
        const _0x56f2bd = document['querySelector']("input[name=\"csrf_token\"]")?.['value'] || '';
        fetch("ajax/check_delivery_demand.php", {
          'method': "POST",
          'headers': {
            'Content-Type': "application/json",
            'X-CSRF-TOKEN': _0x56f2bd
          },
          'body': JSON["stringify"]({
            'time': _0xaa5017
          })
        })["then"](function(_0x48f486) {

          return _0x48f486["json"]();
        })["then"](function(_0x4ae253) {

          "success" === _0x4ae253["status"] ? _0x4ae253['is_high_demand'] ? (_0x2ea230["textContent"] = _0x4ae253['message'], _0x44e783["classList"]['remove']("d-none")) : _0x44e783["classList"]["add"]("d-none") : console['error']("Delivery demand check error:", _0x4ae253["message"]);
        })["catch"](function(_0x749683) {

          console["error"]("Error:", _0x749683);
        });
      }
    } catch (_0x5a8e21) {
      console["error"]("Delivery demand initialization error:", _0x5a8e21);
    }
  });
  let _0x5ea8af = null,
    _0x1f3658 = 0x0;
  const _0x5698d6 = 0x7530;
  async function fetchStockAvailability() {
    const _0x489391 = Date["now"]();
    if (_0x5ea8af && _0x489391 - _0x1f3658 < _0x5698d6) return _0x5ea8af;
    try {
      const _0x84bdf2 = await fetch("/office/stock_management.php?type=all");
      if (!_0x84bdf2['ok']) throw new Error("Stock status fetch failed");
      const _0x268bb7 = await _0x84bdf2["json"]();
      return _0x5ea8af = _0x268bb7, _0x1f3658 = _0x489391, _0x268bb7;
    } catch (_0x156f59) {
      return console["error"]('Stock\x20status\x20fetch\x20error:', _0x156f59), null;
    }
  }

  function isStockAvailable(_0xb7fdca, _0x39315a) {

    if (!_0x5ea8af || !_0x5ea8af[_0xb7fdca]) return !0x0;
    const _0x17f524 = _0x5ea8af[_0xb7fdca][_0x39315a];
    return !_0x17f524 || _0x17f524["in_stock"];
  }

  function applyStockAvailability() {

    _0x5ea8af && (document['querySelectorAll']("input[name=\"viande\"], input[name=\"viande[]\"]")["forEach"](_0x4f4d8b => {
      const _0x59a8cf = isStockAvailable("viandes", _0x4f4d8b["value"]),
        _0x3b55c1 = _0x4f4d8b["closest"]("label") || _0x4f4d8b["parentElement"],
        _0xe13b65 = _0x4f4d8b['closest'](".meat-selection-row") || _0x4f4d8b["closest"]('.form-check');
      if (_0x59a8cf) {
        if (_0x4f4d8b["disabled"] = !0x1, _0xe13b65 && (_0xe13b65["style"]["opacity"] = '1', _0xe13b65["style"]["pointerEvents"] = "auto"), _0x3b55c1) {
          const _0xb43f9d = _0x3b55c1["querySelector"](".out-of-stock-text");
          _0xb43f9d && _0xb43f9d["remove"]();
        }
      } else {
        if (_0x4f4d8b["disabled"] = !0x0, _0x4f4d8b["checked"] = !0x1, _0xe13b65 && (_0xe13b65["style"]["opacity"] = "0.5", _0xe13b65["style"]["pointerEvents"] = 'none'), _0x3b55c1) {
          if (!_0x3b55c1["querySelector"](".out-of-stock-text")) {
            const _0x59635d = document["createElement"]("span");
            _0x59635d["className"] = 'out-of-stock-text\x20text-danger\x20ms-2\x20fw-bold', _0x59635d['textContent'] = " (Temporairement \u00e9puis\u00e9)", _0x3b55c1['appendChild'](_0x59635d);
          }
        }
      }
    }), document["querySelectorAll"]("input[name^=\"garniture\"]")["forEach"](_0x2f3121 => {
      const _0xbeee21 = isStockAvailable('garnitures', _0x2f3121["value"]),
        _0x5f2b83 = _0x2f3121["closest"]("label") || _0x2f3121["parentElement"]["querySelector"]("label");
      if (_0xbeee21) {
        if (_0x2f3121["disabled"] = !0x1, _0x5f2b83) {
          const _0x28ac24 = _0x5f2b83["querySelector"](".out-of-stock-text");
          _0x28ac24 && _0x28ac24["remove"]();
        }
      } else {
        if (_0x2f3121["disabled"] = !0x0, _0x5f2b83) {
          if (!_0x5f2b83["querySelector"](".out-of-stock-text")) {
            const _0x3418cb = document["createElement"]("span");
            _0x3418cb['className'] = "out-of-stock-text text-danger ms-2", _0x3418cb["textContent"] = "(Temporairement \u00e9puis\u00e9)", _0x5f2b83["appendChild"](_0x3418cb);
          }
        }
      }
    }), document["querySelectorAll"]("input[name^=\"sauce\"]")["forEach"](_0x1e2af4 => {
      const _0xbc0540 = isStockAvailable("sauces", _0x1e2af4["value"]),
        _0x30894d = _0x1e2af4["closest"]("label") || _0x1e2af4["parentElement"]["querySelector"]("label");
      if (_0xbc0540) {
        if (_0x1e2af4["disabled"] = !0x1, _0x30894d) {
          const _0xbb91d = _0x30894d["querySelector"](".out-of-stock-text");
          _0xbb91d && _0xbb91d["remove"]();
        }
      } else {
        if (_0x1e2af4['disabled'] = !0x0, _0x30894d) {
          if (!_0x30894d["querySelector"](".out-of-stock-text")) {
            const _0x28808a = document['createElement']("span");
            _0x28808a["className"] = 'out-of-stock-text\x20text-danger\x20ms-2', _0x28808a["textContent"] = "(Temporairement \u00e9puis\u00e9)", _0x30894d["appendChild"](_0x28808a);
          }
        }
      }
    }), document["querySelectorAll"]('input[name=\x22dessert\x22]')['forEach'](_0x53687d => {
      const _0x113c12 = isStockAvailable("desserts", _0x53687d["value"]),
        _0x3cb37e = _0x53687d["closest"]("label") || _0x53687d["parentElement"]["querySelector"]("label");
      if (_0x113c12) {
        if (_0x53687d["disabled"] = !0x1, _0x3cb37e) {
          const _0x56cfef = _0x3cb37e["querySelector"](".out-of-stock-text");
          _0x56cfef && _0x56cfef["remove"]();
        }
      } else {
        if (_0x53687d["disabled"] = !0x0, _0x3cb37e) {
          if (!_0x3cb37e['querySelector']('.out-of-stock-text')) {
            const _0x195c6e = document["createElement"]('span');
            _0x195c6e["className"] = "out-of-stock-text text-danger ms-2", _0x195c6e["textContent"] = "(Temporairement \u00e9puis\u00e9)", _0x3cb37e['appendChild'](_0x195c6e);
          }
        }
      }
    }), document["querySelectorAll"]("input[name=\"boisson\"]")["forEach"](_0x4c53fb => {
      const _0x11b404 = isStockAvailable("boissons", _0x4c53fb["value"]),
        _0x2319d0 = _0x4c53fb["closest"]("label") || _0x4c53fb["parentElement"]['querySelector']("label");
      if (_0x11b404) {
        if (_0x4c53fb['disabled'] = !0x1, _0x2319d0) {
          const _0x56b33f = _0x2319d0["querySelector"](".out-of-stock-text");
          _0x56b33f && _0x56b33f["remove"]();
        }
      } else {
        if (_0x4c53fb['disabled'] = !0x0, _0x2319d0) {
          if (!_0x2319d0["querySelector"]('.out-of-stock-text')) {
            const _0x33a835 = document["createElement"]('span');
            _0x33a835["className"] = 'out-of-stock-text\x20text-danger\x20ms-2', _0x33a835["textContent"] = "(Temporairement \u00e9puis\u00e9)", _0x2319d0["appendChild"](_0x33a835);
          }
        }
      }
    }), document["querySelectorAll"]("input[name=\"extra[]\"]")['forEach'](_0xa04f05 => {
      const _0x492cae = isStockAvailable("extras", _0xa04f05["value"]),
        _0x177665 = _0xa04f05["closest"]("label") || _0xa04f05["parentElement"]['querySelector']("label");
      if (_0x492cae) {
        if (_0xa04f05['disabled'] = !0x1, _0x177665) {
          const _0x5a7a79 = _0x177665["querySelector"]('.out-of-stock-text');
          _0x5a7a79 && _0x5a7a79["remove"]();
        }
      } else {
        if (_0xa04f05["disabled"] = !0x0, _0x177665) {
          if (!_0x177665["querySelector"](".out-of-stock-text")) {
            const _0xfd0b7f = document["createElement"]("span");
            _0xfd0b7f["className"] = "out-of-stock-text text-danger ms-2", _0xfd0b7f['textContent'] = '(Temporairement\x20épuisé)', _0x177665['appendChild'](_0xfd0b7f);
          }
        }
      }
    }));
  }
  document["addEventListener"]('DOMContentLoaded', async function() {
    await fetchStockAvailability(), applyStockAvailability();
  }), document['querySelectorAll']('.modal')['forEach'](_0x3e4f02 => {

    _0x3e4f02["addEventListener"]("shown.bs.modal", async function() {
      await fetchStockAvailability(), applyStockAvailability();
    });
  }), (function() {
    const _0x835a6 = document["getElementById"]("address"),
      _0x45319d = document['getElementById']("autocompleteDropdown");
    if (!_0x835a6 || !_0x45319d) return;
    let _0x399085, _0x37c153 = -0x1,
      _0x433fe5 = [];

    function getPostalCodeFromSummary() {
      const _0x1cfdd3 = document["querySelector"]('.col-4.mt-5.border.rounded\x20.text-center.mt-1.small');
      if (_0x1cfdd3 && 'N/A' !== _0x1cfdd3["textContent"]['trim']()) {
        const _0x26be6e = _0x1cfdd3["textContent"]['trim']()['match'](/^(\d{4})/);
        return _0x26be6e ? _0x26be6e[0x1] : null;
      }
      return null;
    }

    function setActiveAutocompleteItem(_0x269678) {

      _0x45319d['querySelectorAll'](".autocomplete-item")['forEach']((_0x3d7fd2, _0xd51701) => {

        _0x3d7fd2['classList']["toggle"]("active", _0xd51701 === _0x269678);
      }), _0x37c153 = _0x269678;
    }

    function selectAutocompleteSuggestion(_0x5af39e) {
      const _0x239e83 = _0x5af39e["address"]?.["road"] || _0x5af39e["address"]?.['pedestrian'] || '',
        _0xb382b6 = _0x5af39e["address"]?.["house_number"] || '',
        _0x1877bd = _0x835a6["value"]["trim"]()['split'](/\s+/),
        _0x5cf1ed = _0x1877bd[_0x1877bd["length"] - 0x1],
        _0x6fbbce = /^\d+$/ ["test"](_0x5cf1ed);
      _0x835a6["value"] = _0xb382b6 ? _0x239e83 + '\x20' + _0xb382b6 : _0x6fbbce ? _0x239e83 + '\x20' + _0x5cf1ed : _0x239e83, _0x45319d["classList"]["remove"]("show"), setTimeout(() => {

        _0x835a6["focus"]();
        const _0x3a7f81 = _0x835a6["value"]["length"];
        _0x835a6['setSelectionRange'](_0x3a7f81, _0x3a7f81);
      }, 0x64);
    }
    _0x835a6['addEventListener']("input", function() {
      clearTimeout(_0x399085), _0x399085 = setTimeout(async () => {
        const _0x31e95b = _0x835a6["value"]['trim'](),
          _0x44eb71 = getPostalCodeFromSummary();
        if (_0x31e95b["length"] < 0x3) return void _0x45319d['classList']["remove"]("show");
        if (!_0x44eb71) return void _0x45319d['classList']["remove"]("show");
        const _0x3cb753 = await async function(_0x24dec1, _0x42ea81) {
          const _0x986eba = _0x153108;
          if (!_0x42ea81 || _0x24dec1[_0x986eba(0x337)] < 0x3) return [];
          const _0x15638e = function(_0x388cd3) {
              const _0x1f5e81 = _0x986eba,
                _0x2410ad = [{
                  'pattern': /\bchem\.\s*/gi,
                  'replacement': _0x1f5e81(0x1d6)
                }, {
                  'pattern': /\bch\.\s*/gi,
                  'replacement': _0x1f5e81(0x1d6)
                }, {
                  'pattern': /\bav\.\s*/gi,
                  'replacement': _0x1f5e81(0x1cb)
                }, {
                  'pattern': /\bbd\s+/gi,
                  'replacement': 'Boulevard\x20'
                }, {
                  'pattern': /\bpl\.\s*/gi,
                  'replacement': _0x1f5e81(0x275)
                }, {
                  'pattern': /\brte\s+/gi,
                  'replacement': _0x1f5e81(0x161)
                }, {
                  'pattern': /\br\.\s*/gi,
                  'replacement': 'Rue\x20'
                }];
              let _0x2afc98 = _0x388cd3;
              for (const {
                  pattern: _0x819801,
                  replacement: _0x29838b
                }
                of _0x2410ad) _0x2afc98 = _0x2afc98[_0x1f5e81(0x24d)](_0x819801, _0x29838b);
              return _0x2afc98;
            }(_0x24dec1),
            _0x1545c5 = _0x986eba(0x33f) + new URLSearchParams({
              'street': _0x15638e,
              'postalcode': _0x42ea81,
              'country': _0x986eba(0x168),
              'format': 'json',
              'addressdetails': '1',
              'limit': '10',
              'layer': _0x986eba(0x2e1)
            })[_0x986eba(0x235)]();
          try {
            const _0x45a15e = await fetch(_0x1545c5, {
              'headers': {
                'User-Agent': _0x986eba(0x265)
              }
            });
            return await _0x45a15e[_0x986eba(0x290)]();
          } catch (_0x3c4d3c) {
            return console[_0x986eba(0x2b6)]('Nominatim\x20error:', _0x3c4d3c), [];
          }
        }(_0x31e95b, _0x44eb71);
        ! function(_0x4264d0) {
          const _0x3c09f7 = getPostalCodeFromSummary(),
            _0x3f7095 = new Map();
          _0x4264d0['forEach'](_0x186e41 => {
            const _0x596a1b = _0x186e41["address"]?.['road'] || _0x186e41["address"]?.["pedestrian"] || '',
              _0x54547e = _0x186e41["address"]?.["postcode"] || '';
            _0x596a1b && !_0x3f7095['has'](_0x596a1b) && (_0x186e41["_isExactMatch"] = _0x54547e === _0x3c09f7, _0x3f7095["set"](_0x596a1b, _0x186e41));
          }), _0x433fe5 = Array["from"](_0x3f7095["values"]())["sort"]((_0x5b9b7c, _0x257579) => _0x5b9b7c["_isExactMatch"] && !_0x257579["_isExactMatch"] ? -0x1 : !_0x5b9b7c["_isExactMatch"] && _0x257579["_isExactMatch"] ? 0x1 : 0x0), _0x37c153 = -0x1, 0x0 !== _0x433fe5["length"] ? (_0x45319d['innerHTML'] = '', _0x433fe5['forEach']((_0x444a31, _0x1f1f36) => {
            const _0x4974aa = document["createElement"]('div');
            _0x4974aa["className"] = "autocomplete-item", _0x4974aa["dataset"]['index'] = _0x1f1f36;
            const _0x4d8f1f = _0x444a31["address"]?.['road'] || _0x444a31["address"]?.['pedestrian'] || '',
              _0x2f6956 = _0x444a31['address']?.["house_number"] || '',
              _0x4cbeb8 = _0x2f6956 ? _0x4d8f1f + '\x20' + _0x2f6956 : _0x4d8f1f;
            _0x4974aa["innerHTML"] = "\n        <div class=\"street\">" + _0x4cbeb8 + "</div>\n      ", _0x4974aa['addEventListener']("touchstart", _0xb84463 => {
              _0xb84463['preventDefault'](), selectAutocompleteSuggestion(_0x444a31);
            }), _0x4974aa["addEventListener"]("click", _0x4a88e9 => {

              _0x4a88e9["preventDefault"](), selectAutocompleteSuggestion(_0x444a31);
            }), _0x4974aa["addEventListener"]("mouseenter", () => setActiveAutocompleteItem(_0x1f1f36)), _0x45319d["appendChild"](_0x4974aa);
          }), _0x45319d['classList']['add']('show')) : _0x45319d['classList']['remove']("show");
        }(_0x3cb753);
      }, 0x12c);
    }), _0x835a6["addEventListener"]("keydown", _0x1dccf4 => {
      const _0x532d40 = _0x45319d["querySelectorAll"](".autocomplete-item");
      "ArrowDown" === _0x1dccf4["key"] ? (_0x1dccf4["preventDefault"](), _0x37c153 = Math['min'](_0x37c153 + 0x1, _0x532d40["length"] - 0x1), setActiveAutocompleteItem(_0x37c153)) : "ArrowUp" === _0x1dccf4["key"] ? (_0x1dccf4["preventDefault"](), _0x37c153 = Math["max"](_0x37c153 - 0x1, 0x0), setActiveAutocompleteItem(_0x37c153)) : 'Enter' === _0x1dccf4["key"] ? _0x37c153 >= 0x0 && _0x433fe5[_0x37c153] && (_0x1dccf4["preventDefault"](), selectAutocompleteSuggestion(_0x433fe5[_0x37c153])) : "Escape" === _0x1dccf4["key"] && _0x45319d["classList"]["remove"]("show");
    }), document["addEventListener"]("click", _0x3ccbb9 => {

      _0x45319d['contains'](_0x3ccbb9["target"]) || _0x3ccbb9['target'] === _0x835a6 || _0x45319d['classList']["remove"]("show");
    });
  }());
})()));