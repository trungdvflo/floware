describe Api::UsersController, type: :controller do
  include_context 'initialize auth with app_token'
  let!(:time_now) { Time.zone.now.to_i }
  let!(:app_register) { create(:app_register) }
  let!(:virtual_domain) { create(:virtual_domain) }
  let!(:restricted_user_1) { create(:restricted_user, name: 'beta', type_matcher: 0) }
  let!(:restricted_user_2) { create(:restricted_user, name: 'fuck', type_matcher: 1) }
  let!(:user) do
    create(:user, email: 'test02@flomail.net',
                  username: 'test02@flomail.net',
                  fullname: 'test02',
                  secondary_email: 'test03@flomail.net',
                  token: 'test02 token',
                  domain_id: virtual_domain.id)
  end

  describe '#create' do
    let(:make_request) { post :create, params: params }

    before do
      make_request
    end

    context 'when valid' do
      let(:params) do
        {
          email: 'test01@flomail.net',
          secondary_email: 'test01@flomail.net',
          password: 'I/Y5P0FX/XlVCIKLoJUhHaTQwDNlIPzVSmoM8/FwFKjiBrAhilWxG1ehYhliHpph76YsT8gRu8QDc2Cajp3ul3nnzr/U8A9/dOWvGnioVG54yD6/Ii5ZUD2VCRR4lkMY65s+u8n5ftYjYZaHC+zIn5LnjJWwQunl4tIcIvc2/Go=',
          alias: app_register.app_alias,
          tz: 'Asia/Jakarta'
        }
      end

      it 'create successful' do
        expect(User.count).to eq 3
        expect(User.last.email).to eq "test01@flomail.net"
        expect(json_response[:success]).to eq 0
      end
    end

    context 'when invalid' do
      let(:params) do
        {
          email: 'test01.01.01@flomail.net',
          secondary_email: 'test02@flomail.net',
          password: 'I/Y5P0FX/XlVCIKLoJUhHaTQwDNlIPzVSmoM8/FwFKjiBrAhilWxG1ehYhliHpph76YsT8gRu8QDc2Cajp3ul3nnzr/U8A9/dOWvGnioVG54yD6/Ii5ZUD2VCRR4lkMY65s+u8n5ftYjYZaHC+zIn5LnjJWwQunl4tIcIvc2/Go=',
          alias: app_register.app_alias,
          tz: 'Asia/Jakarta'
        }
      end

      # TODO: return wrong message
      # it 'return error' do
      # end
    end

    context 'when that user exist' do

      let(:params) do
        {
          email: 'test02@flomail.net',
          secondary_email: 'test02@flomail.net',
          password: 'I/Y5P0FX/XlVCIKLoJUhHaTQwDNlIPzVSmoM8/FwFKjiBrAhilWxG1ehYhliHpph76YsT8gRu8QDc2Cajp3ul3nnzr/U8A9/dOWvGnioVG54yD6/Ii5ZUD2VCRR4lkMY65s+u8n5ftYjYZaHC+zIn5LnjJWwQunl4tIcIvc2/Go=',
          alias: app_register.app_alias,
          tz: 'Asia/Jakarta'
        }
      end

      it 'return error' do
        expect(json_response[:error]).to eq 1
        expect(json_response[:description]).to include "already exists"
      end
    end

    context 'when that user not allowed with equal word' do

      let(:params) do
        {
          email: 'beta@flomail.net',
          secondary_email: 'test02@flomail.net',
          password: 'I/Y5P0FX/XlVCIKLoJUhHaTQwDNlIPzVSmoM8/FwFKjiBrAhilWxG1ehYhliHpph76YsT8gRu8QDc2Cajp3ul3nnzr/U8A9/dOWvGnioVG54yD6/Ii5ZUD2VCRR4lkMY65s+u8n5ftYjYZaHC+zIn5LnjJWwQunl4tIcIvc2/Go=',
          alias: app_register.app_alias,
          tz: 'Asia/Jakarta'
        }
      end

      it 'return error' do
        expect(json_response[:error]).to eq 26
        expect(json_response[:description]).to include "not allowed"
      end
    end

    context 'when that user not allowed with contain word' do
      let(:params) do
        {
          email: 'fucker_1@flomail.net',
          secondary_email: 'test02@flomail.net',
          password: 'I/Y5P0FX/XlVCIKLoJUhHaTQwDNlIPzVSmoM8/FwFKjiBrAhilWxG1ehYhliHpph76YsT8gRu8QDc2Cajp3ul3nnzr/U8A9/dOWvGnioVG54yD6/Ii5ZUD2VCRR4lkMY65s+u8n5ftYjYZaHC+zIn5LnjJWwQunl4tIcIvc2/Go=',
          alias: app_register.app_alias,
          tz: 'Asia/Jakarta'
        }
      end

      it 'return error' do
        expect(json_response[:error]).to eq 26
        expect(json_response[:description]).to include "not allowed"
      end
    end
  end

  describe '#update' do
    let(:make_request) { post :update, params: params }

    before do
      make_request
    end

    context 'when valid' do
      let(:params) { { fullname: 'test1000' } }

      it 'update successful' do
        expect(User.count).to eq 2
        expect(json_response[:user].count).to eq 20
        expect(json_response[:user][:fullname]).to eq "test1000"
      end
    end

    # TODO: this case always return success
    # context 'when invalid' do
      # let(:params) { { email: 'test1000@flomail.net' } }

      # it 'update failed' do
      # end
    # end
  end

  describe '#token' do
    let(:make_request) { post :token, params: params }

    before do
      make_request
    end

    context 'when valid' do
      let(:params) do
        {
          email: 'test02@flomail.net',
          alias: app_register.app_alias,
          sig: Api::Utils.generate_signature('', current_user.digesta1, app_register.app_regId)
        }
      end

      it 'return token api successful' do
        expect(json_response.count).to eq 2
      end
    end

    context 'when invalid' do
      let(:params) {{ email: 'test02@flomail.net', alias: app_register.app_alias, sig: '' }}

      it 'return error message' do
        expect(json_response[:error]).not_to be_nil
        expect(json_response[:description]).to include 'signature is invalid'
      end
    end
  end

  describe '#change_pass' do
    let!(:app_token) { create(:app_token, user_id: 1) }
    let(:make_request) { post :change_pass, params: params }

    before do
      make_request
    end

    context 'when valid' do
      let(:params) {{ password: 'I/Y5P0FX/XlVCIKLoJUhHaTQwDNlIPzVSmoM8/FwFKjiBrAhilWxG1ehYhliHpph76YsT8gRu8QDc2Cajp3ul3nnzr/U8A9/dOWvGnioVG54yD6/Ii5ZUD2VCRR4lkMY65s+u8n5ftYjYZaHC+zIn5LnjJWwQunl4tIcIvc2/Go=' }}

      it 'change password successful' do
        expect(json_response[:user].count).to eq 20
        expect(AppToken.count).to eq 0
      end
    end
  end

  describe '#check_email' do
    let(:make_request) { post :check_email, params: params }

    before do
      make_request
    end

    context 'when valid' do
      let(:params) {{ email: 'test02@flomail.net' }}

      it 'return token' do
        expect(json_response[:token]).to include 'test02 token'
        expect(json_response[:description]).to include 'email already exists'
        expect(json_response[:success]).to eq 0
      end
    end

    context 'when invalid' do
      let(:params) {{ email: 'test01@flomail.net' }}

      it 'return error' do
        expect(json_response[:error]).to eq 4
        expect(json_response[:description]).to include 'that the email address is not registered with us'
      end
    end
  end
end
